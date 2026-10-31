import { Check } from 'lucide-react';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent text-shell'
                    : isCurrent
                      ? 'bg-accent/20 text-accent ring-2 ring-accent animate-pulse-gold'
                      : 'bg-card-dark text-steel-light'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium mt-2 whitespace-nowrap ${
                  isCurrent ? 'text-accent' : isCompleted ? 'text-gray-700' : 'text-steel-light'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-2 sm:mx-4 mt-[-16px] transition-colors duration-300 ${
                  isCompleted ? 'bg-accent' : 'bg-card-dark'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
