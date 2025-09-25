// Immediate URL decompression script - runs before Alpine.js
(function() {
    console.log('Immediate decompression script running...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const isCompressed = urlParams.get('c') === '1';
    const compressedText = urlParams.get('t');
    
    if (isCompressed && compressedText) {
        console.log('Found compressed text in URL, setting up decompression...');
        
        // Function to decompress and set text
        const decompressAndSet = () => {
            if (!window.LZString) {
                console.log('LZString not ready, waiting...');
                setTimeout(decompressAndSet, 100);
                return;
            }
            
            try {
                const decompressed = window.LZString.decompressFromEncodedURIComponent(compressedText);
                console.log('Decompression result:', decompressed ? `${decompressed.length} chars` : 'failed');
                
                if (decompressed) {
                    // Save to localStorage so Alpine.js can pick it up
                    try {
                        localStorage.setItem('text', decompressed);
                        console.log('Decompressed text saved to localStorage');
                    } catch (error) {
                        console.warn('Failed to save to localStorage:', error);
                    }
                    
                    // Also try to set the textarea directly if it exists
                    const setTextarea = () => {
                        const textarea = document.getElementById('textInput');
                        if (textarea) {
                            textarea.value = decompressed;
                            console.log('Textarea set directly');
                            
                            // Try to trigger Alpine.js update
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        } else {
                            // Wait for DOM to be ready
                            setTimeout(setTextarea, 500);
                        }
                    };
                    
                    // Set textarea when DOM is ready
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', setTextarea);
                    } else {
                        setTextarea();
                    }
                    
                    // Also try after Alpine.js loads
                    setTimeout(setTextarea, 2000);
                }
            } catch (error) {
                console.error('Immediate decompression failed:', error);
            }
        };
        
        // Start decompression
        decompressAndSet();
    }
})();