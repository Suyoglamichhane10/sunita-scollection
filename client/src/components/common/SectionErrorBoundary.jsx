import React from 'react';

// SectionErrorBoundary isolates a single UI section (e.g. the spending chart)
// so a runtime crash in that section can never blank the entire page. It
// renders `fallback` (or null) when a child throws.
class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SectionErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default SectionErrorBoundary;

