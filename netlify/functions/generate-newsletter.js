import fetch from 'node-fetch';

export const handler = async (event) => {
    try {
        const { category } = JSON.parse(event.body);

        const apiKey = process.env.G_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const prompt = `Find the latest news headlines and short summaries from the last 3 days for the category: "${category}". Provide exactly 3-4 headlines and a one-sentence summary for each. Format the response with bold headlines followed by the summary.`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ "google_search": {} }],
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API response error: ${response.statusText}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const generatedText = candidate.content.parts[0].text;
            const groundingMetadata = candidate.groundingMetadata;
            let sources = [];
            if (groundingMetadata && groundingMetadata.groundingAttributions) {
                sources = groundingMetadata.groundingAttributions
                    .map(attribution => ({
                        uri: attribution.web?.uri,
                        title: attribution.web?.title,
                    }))
                    .filter(source => source.uri && source.title);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ generatedText, sources }),
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `No content generated for "${category}".` }),
            };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch data from API." }),
        };
    }
};
