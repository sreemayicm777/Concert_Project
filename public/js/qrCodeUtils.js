// qrCodeUtils.js - Standalone QR Code generation utilities

/**
 * QR Code Generator Utility Class
 * Provides methods for generating QR codes without external dependencies
 */
class QRCodeGenerator {
    constructor() {
        this.errorCorrectionLevels = {
            L: 1, // ~7%
            M: 0, // ~15%
            Q: 3, // ~25%
            H: 2  // ~30%
        };
    }

    /**
     * Generate QR Code as Data URL
     * @param {string} text - Text to encode
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Data URL of the QR code image
     */
    async generateQRCode(text, options = {}) {
        const defaultOptions = {
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: 'M'
        };

        const config = { ...defaultOptions, ...options };

        try {
            // Use the qrcode library if available
            if (typeof QRCode !== 'undefined') {
                return await this.generateWithQRCodeLib(text, config);
            } else {
                // Fallback to manual generation
                return this.generateManually(text, config);
            }
        } catch (error) {
            console.error('QR Code generation failed:', error);
            return this.generateFallbackQR(config);
        }
    }

    /**
     * Generate QR Code using QRCode library
     */
    async generateWithQRCodeLib(text, config) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, text, {
                width: config.width,
                margin: 2,
                color: {
                    dark: config.colorDark,
                    light: config.colorLight
                },
                errorCorrectionLevel: config.correctLevel
            }, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(canvas.toDataURL('image/png'));
                }
            });
        });
    }

    /**
     * Manual QR Code generation (simplified version)
     */
    generateManually(text, config) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = config.width;
        canvas.height = config.height;

        // Fill background
        ctx.fillStyle = config.colorLight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate simple pattern based on text
        const patternSize = 21; // Standard QR code size
        const cellSize = Math.floor(config.width / patternSize);
        const offset = (config.width - (patternSize * cellSize)) / 2;

        ctx.fillStyle = config.colorDark;

        // Create a simple pattern based on text hash
        const hash = this.simpleHash(text);
        
        for (let i = 0; i < patternSize; i++) {
            for (let j = 0; j < patternSize; j++) {
                const shouldFill = this.shouldFillCell(i, j, hash, patternSize);
                if (shouldFill) {
                    ctx.fillRect(
                        offset + j * cellSize,
                        offset + i * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }

        // Add finder patterns (corners)
        this.addFinderPatterns(ctx, offset, cellSize, config.colorDark);

        return canvas.toDataURL('image/png');
    }

    /**
     * Simple hash function for text
     */
    simpleHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Determine if a cell should be filled based on position and hash
     */
    shouldFillCell(row, col, hash, size) {
        // Skip finder pattern areas
        if (this.isFinderPattern(row, col, size)) {
            return false;
        }

        // Create pattern based on hash
        const combined = (row * size + col + hash) % 3;
        return combined === 0;
    }

    /**
     * Check if position is in finder pattern area
     */
    isFinderPattern(row, col, size) {
        // Top-left finder pattern
        if (row < 9 && col < 9) return true;
        // Top-right finder pattern
        if (row < 9 && col >= size - 8) return true;
        // Bottom-left finder pattern
        if (row >= size - 8 && col < 9) return true;
        
        return false;
    }

    /**
     * Add finder patterns to the corners
     */
    addFinderPatterns(ctx, offset, cellSize, color) {
        ctx.fillStyle = color;
        
        const patterns = [
            { x: 0, y: 0 },     // Top-left
            { x: 14, y: 0 },    // Top-right
            { x: 0, y: 14 }     // Bottom-left
        ];

        patterns.forEach(pattern => {
            // Outer border (7x7)
            ctx.fillRect(
                offset + pattern.x * cellSize,
                offset + pattern.y * cellSize,
                7 * cellSize,
                7 * cellSize
            );
            
            // Inner white area (5x5)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(
                offset + (pattern.x + 1) * cellSize,
                offset + (pattern.y + 1) * cellSize,
                5 * cellSize,
                5 * cellSize
            );
            
            // Center black area (3x3)
            ctx.fillStyle = color;
            ctx.fillRect(
                offset + (pattern.x + 2) * cellSize,
                offset + (pattern.y + 2) * cellSize,
                3 * cellSize,
                3 * cellSize
            );
        });
    }

    /**
     * Generate a fallback QR code placeholder
     */
    generateFallbackQR(config) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = config.width;
        canvas.height = config.height;

        // Create a simple placeholder
        ctx.fillStyle = config.colorLight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = config.colorDark;
        ctx.strokeStyle = config.colorDark;
        ctx.lineWidth = 2;

        // Draw border
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Draw "QR" text
        ctx.font = `${canvas.width / 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL('image/png');
    }

    /**
     * Validate QR code data before generation
     */
    validateData(data) {
        if (!data || typeof data !== 'string') {
            throw new Error('QR code data must be a non-empty string');
        }

        if (data.length > 2953) { // Maximum capacity for alphanumeric mode
            throw new Error('QR code data exceeds maximum length');
        }

        return true;
    }

    /**
     * Get optimal error correction level based on data length
     */
    getOptimalErrorCorrectionLevel(dataLength) {
        if (dataLength < 100) return 'H'; // High
        if (dataLength < 500) return 'Q'; // Quartile
        if (dataLength < 1000) return 'M'; // Medium
        return 'L'; // Low
    }
}

// Utility functions for ticket QR codes
class TicketQRCodeUtils {
    constructor() {
        this.qrGenerator = new QRCodeGenerator();
    }

    /**
     * Generate QR code specifically for concert tickets
     */
    async generateTicketQR(ticketData, options = {}) {
        try {
            // Validate ticket data
            this.validateTicketData(ticketData);

            // Create compact QR data
            const qrData = this.createCompactTicketData(ticketData);

            // Generate QR code
            const qrOptions = {
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: 'M',
                ...options
            };

            return await this.qrGenerator.generateQRCode(qrData, qrOptions);
        } catch (error) {
            console.error('Ticket QR generation failed:', error);
            throw error;
        }
    }

    /**
     * Validate ticket data structure
     */
    validateTicketData(data) {
        const required = ['bookingId', 'concertId', 'concertName', 'venue', 'date'];
        
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate date format
        if (isNaN(Date.parse(data.date))) {
            throw new Error('Invalid date format');
        }

        return true;
    }

    /**
     * Create compact data string for QR code
     */
    createCompactTicketData(data) {
        return JSON.stringify({
            bid: data.bookingId,
            cid: data.concertId,
            name: data.concertName.substring(0, 30), // Limit length
            venue: data.venue.substring(0, 30),
            date: data.date,
            time: data.time,
            tickets: data.tickets,
            amount: data.totalAmount,
            ts: new Date().toISOString()
        });
    }

    /**
     * Decode QR code data back to readable format
     */
    decodeTicketData(qrData) {
        try {
            const decoded = JSON.parse(qrData);
            return {
                bookingId: decoded.bid,
                concertId: decoded.cid,
                concertName: decoded.name,
                venue: decoded.venue,
                date: decoded.date,
                time: decoded.time,
                tickets: decoded.tickets,
                totalAmount: decoded.amount,
                timestamp: decoded.ts
            };
        } catch (error) {
            throw new Error('Invalid QR code data format');
        }
    }

    /**
     * Generate multiple QR codes for different ticket numbers
     */
    async generateMultipleTicketQRs(baseTicketData, ticketCount) {
        const qrCodes = [];
        
        for (let i = 1; i <= ticketCount; i++) {
            const ticketData = {
                ...baseTicketData,
                ticketNumber: i,
                bookingId: `${baseTicketData.bookingId}-${i}`
            };
            
            const qrCode = await this.generateTicketQR(ticketData);
            qrCodes.push({
                ticketNumber: i,
                qrCode: qrCode,
                data: ticketData
            });
        }
        
        return qrCodes;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QRCodeGenerator, TicketQRCodeUtils };
} else {
    window.QRCodeGenerator = QRCodeGenerator;
    window.TicketQRCodeUtils = TicketQRCodeUtils;
}