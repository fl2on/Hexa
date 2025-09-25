// Immediate URL decompression script - runs before Alpine.js
(function() {
    console.log('Immediate URL processing script running...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const isCompressed = urlParams.get('c') === '1';
    const compressedText = urlParams.get('t');
    const plainText = urlParams.get('text');
    const titleParam = urlParams.get('title');
    
    // Set title if provided (for both plain and compressed text)
    if (titleParam) {
        try {
            localStorage.setItem('hexaTitle', titleParam);
            console.log('Title saved to localStorage:', titleParam);
            document.title = titleParam + ' - Hexa';
        } catch (error) {
            console.warn('Failed to save title:', error);
        }
    }
    
    // Handle plain text parameter first (simpler case)
    if (plainText && !isCompressed) {
        console.log('Found plain text in URL, setting it...');
        try {
            localStorage.setItem('text', plainText);
            console.log('Plain text saved to localStorage');
            
            // Set textarea directly if available
            const setTextarea = () => {
                const textarea = document.getElementById('textInput');
                if (textarea) {
                    textarea.value = plainText;
                    console.log('Plain text set in textarea');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    setTimeout(setTextarea, 500);
                }
            };
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setTextarea);
            } else {
                setTextarea();
            }
            setTimeout(setTextarea, 2000);
            
        } catch (error) {
            console.warn('Failed to save plain text to localStorage:', error);
        }
        return; // Exit early for plain text
    }
    
    // Handle compressed text
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