export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const hfApiKey = process.env.HF_API_KEY;
    const hfModel = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

    if (!hfApiKey) {
        return res.status(500).json({ error: 'Missing HF_API_KEY environment variable' });
    }

    const prompt = req.body && typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const hfUrl = `https://api-inference.huggingface.co/models/${hfModel}`;

        const response = await fetch(hfUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hfApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data && data.error ? data.error : `Hugging Face returned status ${response.status}`;
            return res.status(response.status).json({ error: message });
        }

        if (!Array.isArray(data) || !data[0] || !data[0].generated_text) {
            return res.status(502).json({ error: 'Unexpected response from Hugging Face' });
        }

        return res.status(200).json({ generatedText: data[0].generated_text });
    } catch (error) {
        return res.status(500).json({ error: error && error.message ? error.message : 'Internal server error' });
    }
}
