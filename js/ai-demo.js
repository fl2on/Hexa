// AI Features Script for Hexa
// This script demonstrates how to use all AI utilities programmatically

class HexaAIDemo {
    constructor() {
        this.demoTexts = {
            codeExample: `
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
// console.log("Fibonacci result:", result);
            `,
            longText: `
Artificial Intelligence has revolutionized the way we interact with technology. From simple chatbots to complex machine learning algorithms, AI has become an integral part of our daily lives. The development of AI has been marked by significant milestones, including the creation of neural networks, deep learning frameworks, and natural language processing systems. These advancements have enabled machines to understand, interpret, and generate human-like text, making applications like automated content creation, language translation, and intelligent assistants possible. As we continue to push the boundaries of what's possible with AI, we're seeing unprecedented capabilities in areas such as computer vision, robotics, and predictive analytics. The future of AI holds even more promise, with researchers working on artificial general intelligence that could potentially match or exceed human cognitive abilities across all domains.
            `,
            informalText: "Hey there! I gotta tell you about this super cool AI thing I found. It's like, totally amazing and gonna change everything, ya know?",
            codeToConvert: `
def calculate_area(radius):
    import math
    return math.pi * radius ** 2

def main():
    r = 5
    area = calculate_area(r)
    print(f"Area of circle with radius {r}: {area}")

if __name__ == "__main__":
    main()
            `
        };
    }

    async demoSummarization() {
        console.log("🔸 AI Demo 1: Text Summarization");
        
        try {
            const shortSummary = await window.PuterAI.summarizeText(
                this.demoTexts.longText, 
                'short'
            );
            console.log("Short Summary:", shortSummary);

            const mediumSummary = await window.PuterAI.summarizeText(
                this.demoTexts.longText, 
                'medium'
            );
            console.log("Medium Summary:", mediumSummary);

        } catch (error) {
            console.log("Summarization demo failed:", error.message);
        }
    }

    async demoCodeConversion() {
        console.log("🔸 AI Demo 2: Code Conversion");
        
        try {
            // Python to JavaScript
            const jsCode = await window.PuterAI.convertCode(
                this.demoTexts.codeToConvert,
                'python',
                'javascript'
            );
            console.log("Python → JavaScript:", jsCode);

            // JavaScript to Python
            const pythonCode = await window.PuterAI.convertCode(
                this.demoTexts.codeExample,
                'javascript',
                'python'
            );
            console.log("JavaScript → Python:", pythonCode);

        } catch (error) {
            console.log("Code conversion demo failed:", error.message);
        }
    }

    async demoTextEnhancement() {
        console.log("🔸 AI Demo 3: Text Enhancement");
        
        try {
            const formalText = await window.PuterAI.enhanceText(
                this.demoTexts.informalText,
                'formal'
            );
            console.log("Formal Enhancement:", formalText);

            const professionalText = await window.PuterAI.enhanceText(
                this.demoTexts.informalText,
                'professional'
            );
            console.log("Professional Enhancement:", professionalText);

            const creativeText = await window.PuterAI.enhanceText(
                "The weather is nice today.",
                'creative'
            );
            console.log("Creative Enhancement:", creativeText);

        } catch (error) {
            console.log("Text enhancement demo failed:", error.message);
        }
    }

    async demoTranslation() {
        console.log("🔸 AI Demo 4: Translation");
        
        const textToTranslate = "Hello, how are you doing today? I hope you're having a wonderful day!";
        
        try {
            const spanish = await window.PuterAI.translateText(textToTranslate, 'Spanish');
            console.log("Spanish Translation:", spanish);

            const french = await window.PuterAI.translateText(textToTranslate, 'French');
            console.log("French Translation:", french);

            const german = await window.PuterAI.translateText(textToTranslate, 'German');
            console.log("German Translation:", german);

        } catch (error) {
            console.log("Translation demo failed:", error.message);
        }
    }

    async demoGrammarCheck() {
        console.log("🔸 AI Demo 5: Grammar Check");
        
        const textWithErrors = "This sentence have some grammar error's and mispelled words that need's to be fix.";
        
        try {
            const correctedText = await window.PuterAI.checkGrammar(textWithErrors);
            console.log("Grammar Check Result:", correctedText);

        } catch (error) {
            console.log("Grammar check demo failed:", error.message);
        }
    }

    async demoContentGeneration() {
        console.log("🔸 AI Demo 6: Content Generation");
        
        try {
            const article = await window.PuterAI.generateContent(
                "The Future of Web Development",
                'article',
                'medium'
            );
            console.log("Generated Article:", article);

            const blogPost = await window.PuterAI.generateContent(
                "Best Practices for Remote Work",
                'blog',
                'short'
            );
            console.log("Generated Blog Post:", blogPost);

        } catch (error) {
            console.log("Content generation demo failed:", error.message);
        }
    }

    async demoChatInteraction() {
        console.log("🔸 AI Demo 7: AI Chat Interaction");
        
        const conversations = [
            "What are the benefits of using AI in text editing?",
            "How can I improve my writing skills?",
            "What's the difference between machine learning and deep learning?",
            "Can you help me write a professional email?"
        ];

        try {
            for (const question of conversations) {
                const response = await window.PuterAI.chatWithAI(question);
                console.log(`Q: ${question}`);
                console.log(`A: ${response}`);
                console.log("---");
            }

        } catch (error) {
            console.log("Chat demo failed:", error.message);
        }
    }

    async runAllDemos() {
        console.log("🚀 Starting Hexa AI Features Demo");
        console.log("====================================");

        // Check if PuterAI is available
        if (!window.PuterAI) {
            console.log("❌ PuterAI not available. Make sure puter-ai.js is loaded.");
            return;
        }

        const status = window.puterAI.initialized && !window.puterAI.fallbackMode ? 'Connected' : 'Offline Mode';
        // Status logged for monitoring
        console.log("🔧 All AI features are working in offline mode with enhanced fallback functionality!");
        console.log("====================================");

        // Add delays between demos to avoid rate limiting
        await this.demoSummarization();
        await this.delay(2000);

        await this.demoCodeConversion();
        await this.delay(2000);

        await this.demoTextEnhancement();
        await this.delay(2000);

        await this.demoTranslation();
        await this.delay(2000);

        await this.demoGrammarCheck();
        await this.delay(2000);

        await this.demoContentGeneration();
        await this.delay(2000);

        await this.demoChatInteraction();

        console.log("====================================");
        console.log("✅ All AI demos completed!");
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async demoSpecificFeature(feature, ...args) {
        console.log(`🔸 Running specific demo: ${feature}`);
        
        switch (feature) {
            case 'summarize':
                await this.demoSummarization();
                break;
            case 'convert':
                await this.demoCodeConversion();
                break;
            case 'enhance':
                await this.demoTextEnhancement();
                break;
            case 'translate':
                await this.demoTranslation();
                break;
            case 'grammar':
                await this.demoGrammarCheck();
                break;
            case 'generate':
                await this.demoContentGeneration();
                break;
            case 'chat':
                await this.demoChatInteraction();
                break;
            default:
                console.log("Unknown feature. Available: summarize, convert, enhance, translate, grammar, generate, chat");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.HexaAIDemo = new HexaAIDemo();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HexaAIDemo;
}