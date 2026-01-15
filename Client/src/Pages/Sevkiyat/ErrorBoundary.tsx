import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: unknown) {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Hata loglama yapılabilir
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "#c0392b" }}>
          <h2>Bir hata oluştu!</h2>
          <p>Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
