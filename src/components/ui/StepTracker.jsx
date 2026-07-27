import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function StepTracker({ steps, activeStepIndex, completedSteps, onStepClick }) {
  return (
    <div className="flex flex-col space-y-4 relative">
      {/* Progress line background */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border-subtle z-0"></div>
      
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex;
        const isCompleted = completedSteps[index];
        const isPast = index < activeStepIndex;

        return (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start gap-4 relative z-10 cursor-pointer ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
            onClick={() => onStepClick && onStepClick(index)}
          >
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display text-lg border-2 transition-colors duration-300
              ${isCompleted ? 'bg-success border-success text-bg-primary' : 
                isActive ? 'bg-accent border-accent text-bg-primary' : 
                'bg-bg-surface border-border-subtle text-text-secondary'}`}
            >
              {isCompleted ? <Check className="w-6 h-6" /> : String(step.step).padStart(2, '0')}
            </div>
            
            <div className="pt-2 pb-6">
              <h4 className={`text-lg font-semibold mb-1 transition-colors ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                {step.instruction}
              </h4>
              {step.details && (
                <p className="text-text-secondary text-sm leading-relaxed">{step.details}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
