import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  ListGroup,
  Spinner
} from 'react-bootstrap';
import { APP_NAME } from '../../utils/constants';

const SubscriptionPlan = ({ currentPlan, plans, onPlanChange, subscription }) => {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handlePlanSelect = async (planName) => {
    if (planName === currentPlan) return;

    setLoadingPlan(planName);
    try {
      await onPlanChange(planName);
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isTrialActive = subscription?.trialEndDate && 
    new Date(subscription.trialEndDate) > new Date();

  const getCardVariant = (planName) => {
    if (planName === currentPlan) return 'success';
    if (planName === 'professional') return 'primary';
    return '';
  };

  const getButtonText = (planName) => {
    if (loadingPlan === planName) {
      return <><Spinner size="sm" className="me-2" />Processing...</>;
    }
    if (planName === currentPlan) {
      return 'Current Plan';
    }
    return 'Select Plan';
  };

  const getButtonVariant = (planName) => {
    if (planName === currentPlan) return 'success';
    return 'primary';
  };

  if (!plans.length) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div>
      {isTrialActive && (
        <div className="alert alert-info mb-4">
          <i className="bi bi-clock me-2"></i>
          <strong>Trial Period Active:</strong> Your trial ends on{' '}
          {new Date(subscription.trialEndDate).toLocaleDateString()}. 
          {` Choose a plan to continue using ${APP_NAME}.`}
        </div>
      )}

      <Row className="g-4">
        {plans.map((plan) => (
          <Col key={plan.name} lg={4} md={6}>
            <Card 
              className={`h-100 position-relative ${
                plan.name === currentPlan ? 'border-success shadow-sm' : ''
              } ${plan.popular ? 'border-primary' : ''}`}
            >
              {plan.popular && (
                <Badge 
                  bg="primary" 
                  className="position-absolute top-0 start-50 translate-middle px-3 py-2"
                  style={{ zIndex: 1 }}
                >
                  Most Popular
                </Badge>
              )}

              {plan.name === currentPlan && (
                <Badge 
                  bg="success" 
                  className="position-absolute top-0 end-0 m-2"
                >
                  Active
                </Badge>
              )}

              <Card.Header 
                className={`text-center py-3 ${
                  getCardVariant(plan.name) ? `bg-${getCardVariant(plan.name)} text-white` : 'bg-light'
                }`}
              >
                <h4 className="mb-1">{plan.displayName}</h4>
                <div className="display-4 fw-bold mb-0">
                  {formatCurrency(plan.price)}
                </div>
                <small className="opacity-75">per month</small>
              </Card.Header>

              <Card.Body className="d-flex flex-column">
                <ListGroup variant="flush" className="border-0 flex-grow-1">
                  {plan.features.map((feature, index) => (
                    <ListGroup.Item 
                      key={index} 
                      className="px-0 border-0 py-2 d-flex align-items-center"
                    >
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <span>{feature}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                <div className="mt-auto pt-3">
                  <Button
                    variant={getButtonVariant(plan.name)}
                    size="lg"
                    className="w-100"
                    onClick={() => handlePlanSelect(plan.name)}
                    disabled={plan.name === currentPlan || loadingPlan === plan.name}
                  >
                    {getButtonText(plan.name)}
                  </Button>
                </div>

                {/* Plan limits info */}
                {plan.limits && (
                  <div className="mt-2">
                    <small className="text-muted">
                      <div className="d-flex justify-content-between">
                        <span>Interviews:</span>
                        <span>{plan.limits.interviews === -1 ? 'Unlimited' : plan.limits.interviews}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Storage:</span>
                        <span>
                          {plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage}MB`}
                        </span>
                      </div>
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Plan comparison note */}
      <div className="mt-4 p-3 bg-light rounded">
        <h6 className="mb-2">
          <i className="bi bi-info-circle me-2"></i>
          Plan Changes & Billing
        </h6>
        <ul className="mb-0 small text-muted">
          <li>Plan changes are prorated - you only pay for the remaining days in your billing cycle</li>
          <li>Upgrades are charged immediately, downgrades provide account credit</li>
          <li>You can change or cancel your subscription at any time</li>
          <li>All plans include email support and regular updates</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPlan;
