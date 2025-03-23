import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import './PromptInput.css'; // Import custom CSS

const examplePrompts = [
  "E-commerce database with products, customers, orders, and reviews",
  "Hospital management system with doctors, patients, appointments",
  "Library management system with books, members, loans",
  "Create a blogging platform with users, posts, comments, and tags"
];

const PromptInput = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Store prompt in sessionStorage first
      sessionStorage.setItem('userPrompt', prompt);
      
      // Show loading animation immediately
      if (onGenerate) {
        onGenerate(prompt);
      }
      
      // API call to generate schema
      const response = await fetch('http://localhost:3000/generate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          userId: 'Supabasev2'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate schema: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received API response:', data);
      
      // Ensure data has the right structure
      if (data && data.tables) {
        // Store the API response directly, ensuring the structure is preserved
        sessionStorage.setItem('schemaData', JSON.stringify(data));
        console.log('Schema data saved to sessionStorage:', data);
        
        // Set a flag to indicate data is ready
        sessionStorage.setItem('dataReady', 'true');
        
        // Double-check that both items were stored correctly
        console.log('Storage check after saving:',{
          dataReady: sessionStorage.getItem('dataReady'),
          hasSchemaData: !!sessionStorage.getItem('schemaData')
        });
      } else {
        console.error('Invalid schema data structure:', data);
        throw new Error('Invalid schema data received');
      }
      
    } catch (error) {
      console.error('Error:', error);
      setIsSubmitting(false);
      sessionStorage.removeItem('dataReady');
      toast.error('Failed to generate schema. Please try again.');
    }
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
  };

  return (
    <motion.div 
      className="position-relative"
      style={{ zIndex: 10 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        scale: 1.01, 
        boxShadow: '0 15px 30px -12px rgba(59, 130, 246, 0.2)'
      }}
    >
      <div 
        className="rounded-4 p-4 position-relative"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Glow effect */}
        <motion.div 
          className="position-absolute"
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
          style={{
            top: '-80px',
            left: '-60px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)',
            filter: 'blur(30px)',
            zIndex: 0
          }}
        />
        
        {/* Decorative element */}
        <motion.div 
          className="position-absolute top-0 end-0" 
          style={{ 
            width: '120px', 
            height: '120px',
            opacity: 0.7,
            zIndex: 0,
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="position-relative" style={{ zIndex: 1 }}>
          <Form onSubmit={handleSubmit} className="mb-3">
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your database requirements and we'll generate an optimized schema"
                className="bg-transparent text-white border-0 p-3 prompt-textarea"
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  background: 'rgba(15, 23, 42, 0.3)',
                  borderRadius: '10px',
                  resize: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              />
            </Form.Group>
            
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="d-grid gap-2"
            >
              <Button
                type="submit"
                variant="primary"
                disabled={!prompt.trim() || isSubmitting}
                className="py-3 position-relative overflow-hidden"
                style={{
                  borderRadius: '10px',
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  border: 'none',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                }}
              >
                Generate Schema
              </Button>
            </motion.div>
          </Form>
          
          <div className="mt-4">
            <p className="text-white-50 text-center mb-3 small">Try one of these examples:</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {examplePrompts.map((example, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="text-white-50 text-nowrap border-0 py-1 px-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '0.8rem',
                      backdropFilter: 'blur(4px)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px',
                      display: 'inline-block'
                    }}
                    onClick={() => handleExampleClick(example)}
                  >
                    {example.length > 30 ? example.substring(0, 30) + '...' : example}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PromptInput; 