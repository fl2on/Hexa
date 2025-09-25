// Simple test for URL decompression without external dependencies
const testCompression = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const compressedText = urlParams.get('t');
    const isCompressed = urlParams.get('c') === '1';
    const scheme = urlParams.get('s') || 'lu';
    
    console.log('URL Parameters:', { compressedText: compressedText ? 'present' : 'missing', isCompressed, scheme });
    
    if (!isCompressed || !compressedText) {
        console.log('No compressed text to process');
        return;
    }
    
    // Wait for dependencies
    const waitForDeps = () => {
        if (window.LZString) {
            console.log('LZString found, attempting decompression...');
            
            try {
                const decompressed = window.LZString.decompressFromEncodedURIComponent(compressedText);
                console.log('Decompression result:', decompressed ? `SUCCESS - ${decompressed.length} chars` : 'FAILED');
                
                if (decompressed) {
                    // Try to set the text in the textarea
                    const textarea = document.getElementById('text-input');
                    if (textarea) {
                        textarea.value = decompressed;
                        console.log('Text set in textarea');
                        
                        // Try to trigger Alpine.js update
                        const app = document.querySelector('[x-data="hexaApp()"]');
                        if (app && app._x_dataStack && app._x_dataStack[0]) {
                            app._x_dataStack[0].text = decompressed;
                            console.log('Text set in Alpine.js data');
                        }
                        
                        // Trigger input event
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            } catch (error) {
                console.error('Decompression error:', error);
            }
        } else {
            console.log('LZString not found, retrying in 100ms...');
            setTimeout(waitForDeps, 100);
        }
    };
    
    waitForDeps();
};

// Run the test when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testCompression);
} else {
    testCompression();
}

console.log('Test compression script loaded');