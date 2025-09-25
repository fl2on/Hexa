// This file contains all developer-focused functionality

// Execute Python code
async function executePython(code) {
    try {
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: "python",
                version: "3.10.0",
                files: [{ content: code }]
            })
        });
        
        const data = await response.json();
        return data.run.output || '✨ Execution completed successfully!';
    } catch (error) {
        return '❌ Error executing code. Please try again.';
    }
}

// Code generators
class CodeGenerator {
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static generatePassword(length = 16) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    static generateLoremIpsum(paragraphs = 3) {
        const lorem = [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
            "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
            "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo."
        ];
        
        let result = '';
        for (let i = 0; i < paragraphs; i++) {
            const sentences = Math.floor(Math.random() * 4) + 3; // 3-6 sentences per paragraph
            let paragraph = '';
            for (let j = 0; j < sentences; j++) {
                paragraph += lorem[Math.floor(Math.random() * lorem.length)] + ' ';
            }
            result += paragraph.trim() + '\n\n';
        }
        return result.trim();
    }

    static generateSampleJSON() {
        return JSON.stringify({
            "name": "John Doe",
            "age": 30,
            "email": "john.doe@example.com",
            "address": {
                "street": "123 Main St",
                "city": "Anytown",
                "zipCode": "12345"
            },
            "hobbies": ["reading", "coding", "traveling"],
            "isActive": true,
            "lastLogin": new Date().toISOString()
        }, null, 2);
    }

    static generateHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to My Page</h1>
            <p>This is a generated HTML template</p>
        </div>
        <div class="content">
            <h2>About</h2>
            <p>Add your content here...</p>
        </div>
    </div>
</body>
</html>`;
    }

    static generateCSS() {
        return `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

/* Navigation */
.nav {
    background: #333;
    padding: 1rem 0;
}

.nav ul {
    list-style: none;
    display: flex;
    justify-content: center;
}

.nav li {
    margin: 0 1rem;
}

.nav a {
    color: white;
    text-decoration: none;
    transition: color 0.3s ease;
}

.nav a:hover {
    color: #667eea;
}

/* Main Content */
.main {
    background: white;
    padding: 2rem;
    margin: 2rem 0;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Buttons */
.btn {
    display: inline-block;
    background: #667eea;
    color: white;
    padding: 0.8rem 1.5rem;
    text-decoration: none;
    border-radius: 5px;
    transition: background 0.3s ease;
    border: none;
    cursor: pointer;
}

.btn:hover {
    background: #5a6fd8;
}

/* Footer */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 1rem 0;
    margin-top: 2rem;
}`;
    }

    static generateJavaScript() {
        return `// Modern JavaScript Template
class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('App initialized');
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded');
        });

        // Example event binding
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', this.handleButtonClick.bind(this));
        });
    }

    handleButtonClick(event) {
        event.preventDefault();
        console.log('Button clicked:', event.target);
        
        // Add your button logic here
        this.showNotification('Button clicked!');
    }

    async loadData() {
        try {
            // Example API call
            const response = await fetch('/api/data');
            const data = await response.json();
            this.renderData(data);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error loading data', 'error');
        }
    }

    renderData(data) {
        // Render data to DOM
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = \`
                <h3>Data loaded:</h3>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
            \`;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = \`notification \${type}\`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utility methods
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize app
const app = new App();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}`;
    }

    static generatePython() {
        return `
"""
Python Template - Basic structure for a Python application
"""

import sys
import os
import json
import argparse
from typing import List, Dict, Optional
from datetime import datetime


class App:
    """Main application class"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.data = []
        
    def run(self):
        """Main application entry point"""
        print("🐍 Python application started")
        try:
            self.load_data()
            self.process_data()
            self.save_results()
            print("✅ Application completed successfully")
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)
    
    def load_data(self):
        """Load data from various sources"""
        # Example: Load from file
        try:
            with open('data.json', 'r') as f:
                self.data = json.load(f)
        except FileNotFoundError:
            print("📝 No data file found, using sample data")
            self.data = self.generate_sample_data()
    
    def process_data(self):
        """Process the loaded data"""
        print(f"🔄 Processing {len(self.data)} items")
        
        for i, item in enumerate(self.data):
            # Example processing
            item['processed_at'] = datetime.now().isoformat()
            item['index'] = i
            
        print("✨ Data processing completed")
    
    def save_results(self):
        """Save processed results"""
        output_file = 'results.json'
        with open(output_file, 'w') as f:
            json.dump(self.data, f, indent=2)
        print(f"💾 Results saved to {output_file}")
    
    @staticmethod
    def generate_sample_data() -> List[Dict]:
        """Generate sample data for testing"""
        return [
            {"id": 1, "name": "Item 1", "value": 100},
            {"id": 2, "name": "Item 2", "value": 200},
            {"id": 3, "name": "Item 3", "value": 300},
        ]
    
    def cleanup(self):
        """Cleanup resources"""
        print("🧹 Cleaning up resources")


def main():
    """Command line interface"""
    parser = argparse.ArgumentParser(description='Python Application Template')
    parser.add_argument('--config', type=str, help='Configuration file path')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    config = {}
    if args.config:
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    if args.verbose:
        print("🔧 Verbose mode enabled")
        config['verbose'] = True
    
    app = App(config)
    app.run()


if __name__ == "__main__":
    main()`;
    }

    static generateSQL() {
        return `-- SQL Template - Database schema and queries
-- Database: example_db

-- Create database (uncomment if needed)
-- CREATE DATABASE example_db;
-- USE example_db;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_price (price)
);

-- Categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Order items table
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Insert sample data
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Books', 'Physical and digital books'),
('Clothing', 'Apparel and accessories');

INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('johndoe', 'john@example.com', 'hashed_password_123', 'John', 'Doe'),
('janesmith', 'jane@example.com', 'hashed_password_456', 'Jane', 'Smith'),
('bobwilson', 'bob@example.com', 'hashed_password_789', 'Bob', 'Wilson');

INSERT INTO products (name, description, price, category_id, stock_quantity) VALUES
('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 1, 50),
('Programming Book', 'Learn advanced programming concepts', 49.99, 2, 100),
('T-Shirt', 'Comfortable cotton t-shirt', 19.99, 3, 200);

-- Common queries
-- Get all products with category names
SELECT p.id, p.name, p.price, c.name as category_name, p.stock_quantity
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.name;

-- Get user orders with total items
SELECT u.username, u.email, o.id as order_id, o.total_amount, o.status,
       COUNT(oi.id) as total_items, o.created_at
FROM users u
JOIN orders o ON u.id = o.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY u.id, o.id
ORDER BY o.created_at DESC;

-- Get top selling products
SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('shipped', 'delivered')
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;

-- Update product stock after sale
UPDATE products 
SET stock_quantity = stock_quantity - 1 
WHERE id = 1 AND stock_quantity > 0;

-- Get monthly sales report
SELECT 
    DATE_FORMAT(o.created_at, '%Y-%m') as month,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.status IN ('shipped', 'delivered')
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
ORDER BY month DESC;`;
    }

    static generatePasswords(length = 12, count = 5, options = {}) {
        const defaults = {
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: true,
            excludeSimilar: true,
            excludeAmbiguous: true
        };
        
        const config = { ...defaults, ...options };
        
        let charset = '';
        if (config.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (config.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (config.includeNumbers) charset += '0123456789';
        if (config.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        if (config.excludeSimilar) {
            charset = charset.replace(/[il1Lo0O]/g, '');
        }
        
        if (config.excludeAmbiguous) {
            charset = charset.replace(/[{}[\]()\/\\'"~,;.<>]/g, '');
        }

        const passwords = [];
        for (let i = 0; i < count; i++) {
            let password = '';
            for (let j = 0; j < length; j++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            passwords.push(password);
        }
        
        return passwords;
    }

    static textToBinary(text) {
        return text.split('')
            .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join(' ');
    }

    static binaryToText(binary) {
        return binary.split(' ')
            .filter(byte => byte.length === 8)
            .map(byte => String.fromCharCode(parseInt(byte, 2)))
            .join('');
    }

    static calculateTextComplexity(text) {
        const metrics = {
            characters: text.length,
            words: text.split(/\s+/).filter(word => word.length > 0).length,
            sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
            paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            averageWordsPerSentence: 0,
            averageCharactersPerWord: 0,
            readabilityScore: 0,
            complexity: 'Simple'
        };

        if (metrics.sentences > 0) {
            metrics.averageWordsPerSentence = (metrics.words / metrics.sentences).toFixed(2);
        }

        if (metrics.words > 0) {
            metrics.averageCharactersPerWord = (metrics.characters / metrics.words).toFixed(2);
        }

    // Simplified readability calculation (similar to Flesch-Kincaid)
        const avgSentenceLength = metrics.averageWordsPerSentence;
        const avgWordLength = metrics.averageCharactersPerWord;
        
        metrics.readabilityScore = Math.max(0, 
            206.835 - (1.015 * avgSentenceLength) - (84.6 * (avgWordLength / 5))
        ).toFixed(1);

        if (metrics.readabilityScore >= 90) metrics.complexity = 'Very Easy';
        else if (metrics.readabilityScore >= 80) metrics.complexity = 'Easy';
        else if (metrics.readabilityScore >= 70) metrics.complexity = 'Fairly Easy';
        else if (metrics.readabilityScore >= 60) metrics.complexity = 'Standard';
        else if (metrics.readabilityScore >= 50) metrics.complexity = 'Fairly Difficult';
        else if (metrics.readabilityScore >= 30) metrics.complexity = 'Difficult';
        else metrics.complexity = 'Very Difficult';

        return metrics;
    }
}

class CodeFeatures {
    static getAutocomplete(text, cursorPosition) {
        const beforeCursor = text.substring(0, cursorPosition);
        const currentWord = beforeCursor.split(/\s/).pop();
        
        const suggestions = {
            'fun': ['function', 'functional'],
            'con': ['console', 'const', 'constructor', 'continue'],
            'ret': ['return'],
            'if': ['if', 'interface'],
            'for': ['for', 'forEach'],
            'whi': ['while'],
            'try': ['try'],
            'cat': ['catch'],
            'fin': ['finally', 'find'],
            'imp': ['import'],
            'exp': ['export', 'extends'],
            'cla': ['class'],
            'thi': ['this'],
            'new': ['new'],
            'var': ['var'],
            'let': ['let'],
            'doc': ['document'],
            'win': ['window']
        };
        
        const matches = suggestions[currentWord.toLowerCase()] || [];
        return matches.filter(suggestion => 
            suggestion.toLowerCase().startsWith(currentWord.toLowerCase())
        );
    }

    static analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        const total = positiveCount + negativeCount;
        if (total === 0) return "😐 Neutral sentiment";
        
        const positiveRatio = positiveCount / total;
        if (positiveRatio > 0.6) return "😊 Positive sentiment";
        if (positiveRatio < 0.4) return "😔 Negative sentiment";
        return "😐 Mixed sentiment";
    }

    static validateCode(code, language) {
        const validators = {
            javascript: this.validateJavaScript,
            python: this.validatePython,
            html: this.validateHTML,
            css: this.validateCSS,
            json: this.validateJSON
        };

        const validator = validators[language.toLowerCase()];
        if (validator) {
            return validator(code);
        }

        return {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: ["🔍 Language not recognized for validation"]
        };
    }

    static validateJavaScript(code) {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push("❌ Mismatched braces: " + Math.abs(openBraces - closeBraces) + " unmatched");
        }

        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            errors.push("❌ Mismatched parentheses: " + Math.abs(openParens - closeParens) + " unmatched");
        }

        if (code.includes('var ')) {
            warnings.push("⚠️ Consider using 'const' or 'let' instead of 'var'");
        }

        if (code.includes('==') && !code.includes('===')) {
            warnings.push("⚠️ Consider using '===' for strict equality");
        }

        if (code.includes('console.log')) {
            suggestions.push("💡 Remove console.log statements before production");
        }

        const functions = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
        functions.forEach(func => {
            if (!func.includes('return') && !func.includes('console.log')) {
                warnings.push("⚠️ Function may be missing a return statement");
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    static validatePython(code) {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        const lines = code.split('\n');
        let expectedIndent = 0;
        let indentSize = null;

        lines.forEach((line, index) => {
            if (line.trim() === '') return;

            const leadingSpaces = line.match(/^ */)[0].length;
            
            if (indentSize === null && leadingSpaces > 0) {
                indentSize = leadingSpaces;
            }

            if (line.trim().endsWith(':')) {
                expectedIndent += indentSize || 4;
            }
        });

        if (code.includes('print ')) {
            warnings.push("⚠️ Use print() function syntax for Python 3");
        }

        if (!code.includes('import') && code.length > 100) {
            suggestions.push("💡 Consider adding imports for better modularity");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    static validateHTML(code) {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        if (!code.includes('<!DOCTYPE')) {
            warnings.push("⚠️ Missing DOCTYPE declaration");
        }

        if (!code.includes('<html')) {
            warnings.push("⚠️ Missing <html> tag");
        }

        if (!code.includes('<head>') || !code.includes('</head>')) {
            warnings.push("⚠️ Missing <head> section");
        }

        if (!code.includes('<body>') || !code.includes('</body>')) {
            warnings.push("⚠️ Missing <body> section");
        }

        const openTags = code.match(/<\w+[^>]*>/g) || [];
        const closeTags = code.match(/<\/\w+>/g) || [];
        
        if (openTags.length > closeTags.length) {
            warnings.push("⚠️ Possible unclosed tags detected");
        }

        if (code.includes('<img') && !code.includes('alt=')) {
            suggestions.push("💡 Add alt attributes to images for accessibility");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    static validateCSS(code) {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push("❌ Mismatched braces in CSS");
        }

        const rules = code.match(/[^}]+\{[^}]+\}/g) || [];
        rules.forEach(rule => {
            const properties = rule.split('{')[1].split('}')[0].trim();
            if (properties && !properties.endsWith(';') && properties.includes(':')) {
                warnings.push("⚠️ Missing semicolon in CSS rule");
            }
        });

        if (code.includes('!important')) {
            suggestions.push("💡 Avoid using !important when possible");
        }

        if (code.includes('font-size') && !code.includes('rem') && !code.includes('em')) {
            suggestions.push("💡 Consider using relative units (rem, em) for font-size");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    static validateJSON(code) {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        try {
            JSON.parse(code);
            suggestions.push("✅ Valid JSON format");
        } catch (error) {
            errors.push("❌ Invalid JSON: " + error.message);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    static generateCodeSnippet(type, language) {
        const snippets = {
            javascript: {
                function: `function ${type}() {\n    // TODO: Implement function\n    return null;\n}`,
                class: `class ${type} {\n    constructor() {\n        // TODO: Initialize properties\n    }\n\n    method() {\n        // TODO: Implement method\n    }\n}`,
                async: `async function ${type}() {\n    try {\n        // TODO: Implement async operation\n        const result = await someAsyncOperation();\n        return result;\n    } catch (error) {\n        console.error('Error:', error);\n        throw error;\n    }\n}`,
                component: `const ${type} = ({ props }) => {\n    const [state, setState] = useState(null);\n\n    useEffect(() => {\n        // TODO: Side effects\n    }, []);\n\n    return (\n        <div>\n            {/* TODO: JSX content */}\n        </div>\n    );\n};`
            },
            python: {
                function: `def ${type}():\n    \"\"\"\n    TODO: Add function description\n    \"\"\"\n    pass`,
                class: `class ${type}:\n    \"\"\"\n    TODO: Add class description\n    \"\"\"\n    \n    def __init__(self):\n        # TODO: Initialize attributes\n        pass\n    \n    def method(self):\n        # TODO: Implement method\n        pass`,
                async: `import asyncio\n\nasync def ${type}():\n    \"\"\"\n    TODO: Add async function description\n    \"\"\"\n    try:\n        # TODO: Implement async operation\n        result = await some_async_operation()\n        return result\n    except Exception as e:\n        print(f\"Error: {e}\")\n        raise`,
                decorator: `def ${type}(func):\n    \"\"\"\n    TODO: Add decorator description\n    \"\"\"\n    def wrapper(*args, **kwargs):\n        # TODO: Pre-execution logic\n        result = func(*args, **kwargs)\n        # TODO: Post-execution logic\n        return result\n    return wrapper`
            },
            html: {
                component: `<div class="${type}">\n    <h2>TODO: Add title</h2>\n    <p>TODO: Add content</p>\n</div>`,
                form: `<form class="${type}-form">\n    <label for="${type}-input">TODO: Label</label>\n    <input type="text" id="${type}-input" name="${type}" required>\n    <button type="submit">Submit</button>\n</form>`,
                card: `<div class="card ${type}-card">\n    <div class="card-header">\n        <h3>TODO: Card Title</h3>\n    </div>\n    <div class="card-body">\n        <p>TODO: Card content</p>\n    </div>\n    <div class="card-footer">\n        <button>TODO: Action</button>\n    </div>\n</div>`
            },
            css: {
                component: `.${type} {\n    /* TODO: Add styles */\n    display: block;\n    margin: 0;\n    padding: 0;\n}`,
                layout: `.${type}-container {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n    gap: 1rem;\n    padding: 1rem;\n}\n\n.${type}-item {\n    background: white;\n    border-radius: 8px;\n    padding: 1rem;\n    box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}`,
                animation: `@keyframes ${type} {\n    0% {\n        /* TODO: Initial state */\n        opacity: 0;\n        transform: translateY(20px);\n    }\n    100% {\n        /* TODO: Final state */\n        opacity: 1;\n        transform: translateY(0);\n    }\n}\n\n.${type}-animated {\n    animation: ${type} 0.3s ease-out;\n}`
            }
        };

        const langSnippets = snippets[language.toLowerCase()];
        if (langSnippets && langSnippets[type]) {
            return langSnippets[type];
        }

        return `// TODO: Implement ${type} for ${language}`;
    }
}

// Exportar todas las clases para acceso global
window.CodeGenerator = CodeGenerator;
window.CodeFeatures = CodeFeatures;
window.executePython = executePython;