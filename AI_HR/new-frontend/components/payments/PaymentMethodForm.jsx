import React, { useState } from 'react';
import {
  Form,
  Button,
  Card,
  Alert,
  Row,
  Col,
  Badge,
  Spinner
} from 'react-bootstrap';

const PaymentMethodForm = ({ 
  paymentMethods, 
  paymentIntent, 
  onSubmit, 
  processing 
}) => {
  const [selectedMethod, setSelectedMethod] = useState(
    paymentMethods.find(method => method.isDefault)?.id || 'new'
  );
  const [newCardData, setNewCardData] = useState({
    cardNumber: '4242424242424242', // Demo card number
    expiryMonth: '12',
    expiryYear: '2027',
    cvc: '123',
    cardholderName: '',
    billingZip: ''
  });
  const [saveCard, setSaveCard] = useState(false);
  const [errors, setErrors] = useState({});

  const validateCardData = () => {
    const newErrors = {};

    if (selectedMethod === 'new') {
      if (!newCardData.cardNumber || newCardData.cardNumber.length < 13) {
        newErrors.cardNumber = 'Invalid card number';
      }
      if (!newCardData.expiryMonth || !newCardData.expiryYear) {
        newErrors.expiry = 'Invalid expiry date';
      }
      if (!newCardData.cvc || newCardData.cvc.length < 3) {
        newErrors.cvc = 'Invalid CVC';
      }
      if (!newCardData.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateCardData()) {
      return;
    }

    const paymentData = {
      paymentMethodId: selectedMethod === 'new' ? 'pm_demo_card_123' : selectedMethod,
      ...(selectedMethod === 'new' && {
        cardData: newCardData,
        saveCard
      })
    };

    onSubmit(paymentData);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'card';
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Alert variant="info" className="mb-3">
        <i className="bi bi-shield-check me-2"></i>
        <strong>Demo Mode:</strong> This is a demonstration payment form. 
        No real charges will be made.
      </Alert>

      {/* Payment Method Selection */}
      <div className="mb-4">
        <Form.Label className="fw-medium mb-3">Select Payment Method</Form.Label>

        {paymentMethods.map((method) => (
          <Card 
            key={method.id} 
            className={`mb-2 cursor-pointer ${selectedMethod === method.id ? 'border-primary' : ''}`}
            onClick={() => setSelectedMethod(method.id)}
            style={{ cursor: 'pointer' }}
          >
            <Card.Body className="py-2">
              <div className="d-flex align-items-center">
                <Form.Check
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="me-3"
                />
                <div className="d-flex align-items-center flex-grow-1">
                  <i className={`bi bi-credit-card-2-front me-2 text-${method.card.brand}`}></i>
                  <span>**** **** **** {method.card.last4}</span>
                  <span className="text-muted ms-2">
                    {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear}
                  </span>
                  {method.isDefault && (
                    <Badge bg="primary" className="ms-2">Default</Badge>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}

        {/* Add New Card Option */}
        <Card 
          className={`cursor-pointer ${selectedMethod === 'new' ? 'border-primary' : ''}`}
          onClick={() => setSelectedMethod('new')}
          style={{ cursor: 'pointer' }}
        >
          <Card.Body className="py-2">
            <div className="d-flex align-items-center">
              <Form.Check
                type="radio"
                name="paymentMethod"
                value="new"
                checked={selectedMethod === 'new'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="me-3"
              />
              <i className="bi bi-plus-circle me-2 text-primary"></i>
              <span>Add new payment method</span>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* New Card Form */}
      {selectedMethod === 'new' && (
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">
              <i className="bi bi-credit-card me-2"></i>
              New Payment Method
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Card Number</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formatCardNumber(newCardData.cardNumber)}
                      onChange={(e) => setNewCardData({
                        ...newCardData,
                        cardNumber: e.target.value.replace(/\s/g, '')
                      })}
                      isInvalid={errors.cardNumber}
                      maxLength={19}
                    />
                    <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                      <i className={`bi bi-credit-card text-${getCardBrand(newCardData.cardNumber)}`}></i>
                    </div>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.cardNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Row>
                    <Col>
                      <Form.Select
                        value={newCardData.expiryMonth}
                        onChange={(e) => setNewCardData({
                          ...newCardData,
                          expiryMonth: e.target.value
                        })}
                        isInvalid={errors.expiry}
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Select
                        value={newCardData.expiryYear}
                        onChange={(e) => setNewCardData({
                          ...newCardData,
                          expiryYear: e.target.value
                        })}
                        isInvalid={errors.expiry}
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => (
                          <option key={i} value={String(new Date().getFullYear() + i)}>
                            {new Date().getFullYear() + i}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                  {errors.expiry && (
                    <div className="invalid-feedback d-block">{errors.expiry}</div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CVC</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    value={newCardData.cvc}
                    onChange={(e) => setNewCardData({
                      ...newCardData,
                      cvc: e.target.value.replace(/\D/g, '')
                    })}
                    isInvalid={errors.cvc}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.cvc}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Cardholder Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="John Doe"
                    value={newCardData.cardholderName}
                    onChange={(e) => setNewCardData({
                      ...newCardData,
                      cardholderName: e.target.value
                    })}
                    isInvalid={errors.cardholderName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.cardholderName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Billing ZIP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="12345"
                    value={newCardData.billingZip}
                    onChange={(e) => setNewCardData({
                      ...newCardData,
                      billingZip: e.target.value
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Check
              type="checkbox"
              label="Save this payment method for future use"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
            />
          </Card.Body>
        </Card>
      )}

      {/* Submit Button */}
      <div className="d-flex justify-content-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={processing}
          className="px-4"
        >
          {processing ? (
            <>
              <Spinner size="sm" className="me-2" />
              Processing Payment...
            </>
          ) : (
            <>
              <i className="bi bi-shield-lock me-2"></i>
              Complete Payment
            </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default PaymentMethodForm;