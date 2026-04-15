import React from 'react';
import { Modal, Button, Table, Alert, Badge } from 'react-bootstrap';

const ProrationModal = ({
  show,
  onHide,
  currentPlan,
  newPlan,
  prorationData,
  onConfirm,
  formatCurrency
}) => {
  if (!prorationData) return null;

  const isUpgrade = prorationData.amountToPay > 0;
  const isDowngrade = prorationData.credit > 0;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className={`bi bi-arrow-${isUpgrade ? 'up' : 'down'}-circle me-2`}></i>
          Plan Change Summary
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center align-items-center gap-3">
            <Badge bg="secondary" className="px-3 py-2 text-capitalize">
              {currentPlan}
            </Badge>
            <i className="bi bi-arrow-right fs-4 text-primary"></i>
            <Badge bg="primary" className="px-3 py-2 text-capitalize">
              {newPlan}
            </Badge>
          </div>
        </div>

        <Alert variant={isUpgrade ? 'info' : 'success'} className="mb-3">
          <div className="d-flex align-items-center">
            <i className={`bi bi-info-circle me-2`}></i>
            <div>
              <strong>Prorated Billing:</strong> You will be charged only for the remaining 
              {prorationData.remainingDays} days in your current billing cycle.
            </div>
          </div>
        </Alert>

        <Table bordered className="mb-3">
          <tbody>
            <tr>
              <td>
                <strong>Current Plan Unused Amount</strong>
                <br />
                <small className="text-muted">
                  Refund for {prorationData.remainingDays} unused days
                </small>
              </td>
              <td className="text-end text-success">
                +{formatCurrency(prorationData.currentPlanUnused)}
              </td>
            </tr>
            <tr>
              <td>
                <strong>New Plan Prorated Amount</strong>
                <br />
                <small className="text-muted">
                  Charge for {prorationData.remainingDays} days on new plan
                </small>
              </td>
              <td className="text-end text-danger">
                -{formatCurrency(prorationData.newPlanProrated)}
              </td>
            </tr>
            <tr className="table-active">
              <td>
                <strong>
                  {isUpgrade ? 'Amount to Pay' : 'Credit Applied'}
                </strong>
              </td>
              <td className="text-end">
                <strong className={isUpgrade ? 'text-danger' : 'text-success'}>
                  {isUpgrade 
                    ? formatCurrency(prorationData.amountToPay)
                    : `+${formatCurrency(prorationData.credit)} credit`
                  }
                </strong>
              </td>
            </tr>
          </tbody>
        </Table>

        <div className="bg-light p-3 rounded">
          <h6 className="mb-2">What happens next:</h6>
          <ul className="mb-0 small">
            {isUpgrade ? (
              <>
                <li>You'll be charged {formatCurrency(prorationData.amountToPay)} today</li>
                <li>Your plan will upgrade to {newPlan} immediately</li>
                <li>Next full billing cycle starts on your regular billing date</li>
              </>
            ) : (
              <>
                <li>Your plan will change to {newPlan} immediately</li>
                <li>Credit of {formatCurrency(prorationData.credit)} will be applied to your account</li>
                <li>Your next billing will reflect the new plan rate</li>
              </>
            )}
          </ul>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant={isUpgrade ? 'primary' : 'success'} 
          onClick={onConfirm}
          className="px-4"
        >
          {isUpgrade ? `Pay ${formatCurrency(prorationData.amountToPay)}` : 'Apply Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProrationModal;