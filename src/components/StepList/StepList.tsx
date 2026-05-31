import './StepList.scss';

export interface Step {
  name: string;
  description: string;
}

interface StepListProps {
  steps: Step[];
}

export function StepList({ steps }: StepListProps) {
  return (
    <div className="step-list">
      {steps.map((step, i) => (
        <div key={i} className="step-list__item">
          <div className="step-list__num">{i + 1}</div>
          <div className="step-list__body">
            <div className="step-list__name">{step.name}</div>
            <div className="step-list__desc">{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
