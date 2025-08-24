import { ShieldCheck, Award, EyeOff } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Self-Sovereign Identity",
      description: "Complete control over your digital identity without relying on centralized authorities. Your identity, your rules.",
      gradient: "from-web3-purple to-web3-blue"
    },
    {
      icon: Award,
      title: "Verifiable Credentials",
      description: "Store and share tamper-proof credentials including degrees, licenses, and certifications on the blockchain.",
      gradient: "from-web3-blue to-web3-cyan"
    },
    {
      icon: EyeOff,
      title: "Privacy & Zero-Knowledge",
      description: "Share proofs without revealing sensitive data using advanced cryptographic techniques and zero-knowledge protocols.",
      gradient: "from-web3-cyan to-web3-purple"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-900 bg-opacity-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="features-title">
            <span className="bg-gradient-to-r from-web3-purple to-web3-blue bg-clip-text text-transparent">
              Core Features
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto" data-testid="features-subtitle">
            Built on cutting-edge blockchain technology for ultimate security and privacy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="credential-card p-8 rounded-2xl text-center" data-testid={`feature-card-${index}`}>
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6`}>
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4" data-testid={`feature-title-${index}`}>
                {feature.title}
              </h3>
              <p className="text-gray-300" data-testid={`feature-description-${index}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
