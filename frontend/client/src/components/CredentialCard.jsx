import { Button } from '@/components/ui/button';
import { Share, Eye, GraduationCap, FileText, Car, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CredentialCard = ({ credential }) => {
  const { toast } = useToast();

  const getCredentialIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'degree':
      case 'university degree':
        return GraduationCap;
      case 'pan':
      case 'pan card':
        return FileText;
      case 'license':
      case 'driving license':
        return Car;
      default:
        return Award;
    }
  };

  const getCredentialGradient = (type) => {
    switch (type.toLowerCase()) {
      case 'degree':
      case 'university degree':
        return 'from-blue-500 to-purple-500';
      case 'pan':
      case 'pan card':
        return 'from-green-500 to-teal-500';
      case 'license':
      case 'driving license':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const handleShare = () => {
    toast({
      title: "Credential Shared",
      description: `${credential.title} has been shared successfully!`,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const Icon = getCredentialIcon(credential.type);

  return (
    <div className="credential-card p-6 rounded-2xl" data-testid={`credential-card-${credential.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${getCredentialGradient(credential.type)} rounded-2xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className="text-green-500 text-sm font-medium" data-testid={`credential-status-${credential.id}`}>
          {credential.status === 'active' ? 'Verified' : credential.status}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2" data-testid={`credential-title-${credential.id}`}>
        {credential.title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-1" data-testid={`credential-issuer-${credential.id}`}>
        {credential.metadata?.issuer || 'Unknown Issuer'}
      </p>
      
      <p className="text-gray-500 text-xs mb-4" data-testid={`credential-date-${credential.id}`}>
        Issued: {formatDate(credential.issueDate)}
        {credential.expiryDate && ` • Expires: ${formatDate(credential.expiryDate)}`}
      </p>
      
      <div className="flex justify-between">
        <Button 
          variant="ghost"
          size="sm"
          className="text-web3-purple hover:text-web3-blue transition-colors p-0"
          data-testid={`credential-view-${credential.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
        
        <Button 
          onClick={handleShare}
          size="sm"
          className="glow-button text-white px-4 py-2 text-sm rounded-lg"
          data-testid={`credential-share-${credential.id}`}
        >
          <Share className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default CredentialCard;
