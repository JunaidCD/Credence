const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Store Credentials",
      description: "Securely store your verified credentials on the blockchain with cryptographic proof of authenticity.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Digital certificate storage"
    },
    {
      number: 2,
      title: "Receive Request",
      description: "Get verification requests from employers, institutions, or services that need to validate your credentials.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Business verification meeting"
    },
    {
      number: 3,
      title: "Approve & Verify",
      description: "Choose what to share, approve the request, and let verifiers instantly confirm your credentials' authenticity.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Security verification approval"
    }
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="how-it-works-title">
            <span className="bg-gradient-to-r from-web3-blue to-web3-cyan bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto" data-testid="how-it-works-subtitle">
            Simple, secure, and decentralized credential management in three easy steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center" data-testid={`step-${index}`}>
              <div className="relative mb-8">
                <img 
                  src={step.image} 
                  alt={step.alt}
                  className="rounded-2xl shadow-lg mx-auto w-full max-w-sm h-48 object-cover"
                  data-testid={`step-image-${index}`}
                />
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-web3-purple to-web3-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4" data-testid={`step-title-${index}`}>
                {step.title}
              </h3>
              <p className="text-gray-300" data-testid={`step-description-${index}`}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
