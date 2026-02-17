import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, User, Building, FileText, Award, GraduationCap, Car, Hash, Copy, Check } from 'lucide-react';

const getCredentialIcon = (type) => {
  if (!type || typeof type !== 'string') {
    return Award;
  }
  
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
  if (!type || typeof type !== 'string') {
    return 'from-purple-500 to-pink-500';
  }
  
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

// Generate unique credential ID
const generateCredentialId = (credential) => {
  // If credential already has a unique ID, use it
  if (credential.uniqueId) {
    return credential.uniqueId;
  }
  
  // Generate new unique ID based on credential type
  const type = credential.credentialType || credential.type || 'CRED';
  let prefix = 'CRD';
  
  switch (type.toLowerCase()) {
    case 'degree':
    case 'university degree':
      prefix = 'DEG';
      break;
    case 'certificate':
    case 'professional certificate':
      prefix = 'CERT';
      break;
    case 'license':
    case 'driving license':
      prefix = 'LIC';
      break;
    case 'pan':
    case 'pan card':
      prefix = 'PAN';
      break;
    default:
      prefix = 'CRD';
  }
  
  // Generate random alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${randomStr}`;
};

const CredentialCard = ({ credential }) => {
  const [copied, setCopied] = useState(false);
  const IconComponent = getCredentialIcon(credential.credentialType || credential.type);
  const gradientClass = getCredentialGradient(credential.credentialType || credential.type);
  
  // Generate unique credential ID
  const credentialId = generateCredentialId(credential);

  // Copy credential ID to clipboard
  const copyCredentialId = async () => {
    try {
      await navigator.clipboard.writeText(credentialId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy credential ID:', err);
    }
  };
  
  // Get credential title from various possible sources
  const credentialTitle = credential.data?.title || 
                         credential.title || 
                         credential.data?.credentialTitle ||
                         credential.data?.collegeName ||
                         'Untitled Credential';
  
  // Get credential type
  const credentialType = credential.credentialType || credential.type || 'Unknown Type';
  
  // Get issuer information
  const issuerAddress = credential.issuer || 'Unknown Issuer';
  
  // Get recipient name from various sources
  const recipientName = credential.data?.recipientName || 
                       credential.data?.name ||
                       credential.data?.holderName ||
                       credential.holder ||
                       'Unknown Recipient';
  
  // Get issue date
  const issueDate = credential.issueDate || 
                   (credential.issuedAt ? new Date(credential.issuedAt * 1000).toISOString().split('T')[0] : null) ||
                   new Date().toISOString().split('T')[0];

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge 
          variant={credential.status === 'Active' ? 'default' : credential.status === 'Expired' ? 'destructive' : 'secondary'}
          className="text-xs font-medium backdrop-blur-sm"
        >
          {credential.status || 'Active'}
        </Badge>
      </div>

      <CardContent className="p-5 relative z-10">
        {/* Credential ID Badge with Copy Button */}
        <div className="mb-3">
          <div className="inline-flex items-center space-x-1.5 bg-slate-800/70 border border-slate-600/50 rounded-lg px-2.5 py-1.5 group/id">
            <Hash className="h-3 w-3 text-slate-400" />
            <span className="text-xs font-mono text-slate-300 font-medium">{credentialId}</span>
            <button
              onClick={copyCredentialId}
              className="ml-2 p-1 rounded hover:bg-slate-700/50 transition-all duration-200 opacity-0 group-hover/id:opacity-100 focus:opacity-100"
              title={copied ? "Copied!" : "Copy Credential ID"}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-300" />
              )}
            </button>
          </div>
        </div>
        
        {/* Header with icon and title */}
        <div className="flex items-start space-x-3 mb-4">
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradientClass} shadow-lg flex-shrink-0`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white mb-1 truncate">
              {credentialTitle}
            </h3>
            <p className="text-sm text-slate-400 font-medium">
              {credentialType}
            </p>
          </div>
        </div>

        {/* Credential details - compact layout */}
        <div className="space-y-2.5">
          {/* Issuer DID */}
          <div className="flex items-center space-x-2.5">
            <Building className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-medium">Issuer Address</p>
              <p className="text-xs text-slate-300 font-mono truncate">{issuerAddress}</p>
            </div>
          </div>

          {/* Recipient Name */}
          <div className="flex items-center space-x-2.5">
            <User className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-medium">Recipient</p>
              <p className="text-xs text-slate-300 truncate">{recipientName}</p>
            </div>
          </div>

          {/* Issue Date */}
          <div className="flex items-center space-x-2.5">
            <Calendar className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-medium">Issue Date</p>
              <p className="text-xs text-slate-300">{issueDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CredentialCard;
