import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Save, 
  GraduationCap, 
  User, 
  Hash, 
  TrendingUp, 
  Code, 
  Award,
  Wallet,
  Sparkles
} from 'lucide-react';

const CredentialForm = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    collegeName: '',
    studentName: '',
    rollNo: '',
    gpa: '',
    stream: '',
    character: '',
    studentDid: user?.did || '',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});

  const streamOptions = [
    { value: 'CSE', label: 'Computer Science Engineering (CSE)' },
    { value: 'IT', label: 'Information Technology (IT)' },
    { value: 'ECE', label: 'Electronics & Communication Engineering (ECE)' },
    { value: 'EE', label: 'Electrical Engineering (EE)' },
    { value: 'Others', label: 'Others' }
  ];

  const characterOptions = [
    { value: 'Good', label: 'Good' },
    { value: 'Satisfactory', label: 'Satisfactory' },
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Well Disciplined and Honest', label: 'Well Disciplined and Honest' },
    { value: 'Exemplary Behavior', label: 'Exemplary Behavior' }
  ];

  const createCredentialMutation = useMutation({
    mutationFn: async (credentialData) => {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialData)
      });
      if (!response.ok) throw new Error('Failed to create credential');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/user'] });
      toast({
        title: "Credential Created! 🎉",
        description: "Your academic credential has been successfully added to your profile.",
      });
      onClose();
      setFormData({
        collegeName: '',
        studentName: '',
        rollNo: '',
        gpa: '',
        stream: '',
        character: '',
        studentDid: user?.did || '',
        additionalNotes: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create credential. Please try again.",
        variant: "destructive"
      });
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
    }

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }

    if (!formData.rollNo.trim()) {
      newErrors.rollNo = 'Roll number is required';
    }

    if (!formData.gpa) {
      newErrors.gpa = 'GPA is required';
    } else if (isNaN(formData.gpa) || formData.gpa < 0 || formData.gpa > 10) {
      newErrors.gpa = 'GPA must be a number between 0 and 10';
    }

    if (!formData.stream) {
      newErrors.stream = 'Stream selection is required';
    }

    if (!formData.character) {
      newErrors.character = 'Character assessment is required';
    }

    if (!formData.studentDid.trim()) {
      newErrors.studentDid = 'Student DID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });
      return;
    }

    const credentialData = {
      type: 'Academic Credential',
      data: {
        collegeName: formData.collegeName,
        studentName: formData.studentName,
        rollNumber: formData.rollNo,
        gpa: parseFloat(formData.gpa),
        stream: formData.stream,
        character: formData.character,
        studentDid: formData.studentDid,
        additionalNotes: formData.additionalNotes,
        issuedAt: new Date().toISOString(),
        issuer: 'Self-Attested'
      },
      userId: user?.id
    };

    createCredentialMutation.mutate(credentialData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto credential-card">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-web3-purple to-web3-blue rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  Add Academic Credential
                  <Sparkles className="ml-2 h-5 w-5 text-web3-purple" />
                </CardTitle>
                <p className="text-gray-400 mt-1">Create your verifiable academic credential</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* College Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-5 w-5 text-web3-purple" />
                <h3 className="text-lg font-semibold text-white">Institution Details</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collegeName" className="text-gray-300 font-medium">
                    College/University Name *
                  </Label>
                  <Input
                    id="collegeName"
                    value={formData.collegeName}
                    onChange={(e) => handleInputChange('collegeName', e.target.value)}
                    placeholder="Enter your college or university name"
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-web3-purple focus:border-transparent ${
                      errors.collegeName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.collegeName && (
                    <p className="text-red-400 text-sm">{errors.collegeName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stream" className="text-gray-300 font-medium">
                    Stream/Branch *
                  </Label>
                  <Select value={formData.stream} onValueChange={(value) => handleInputChange('stream', value)}>
                    <SelectTrigger className={`bg-gray-800/50 border-gray-700 text-white focus:ring-2 focus:ring-web3-purple ${
                      errors.stream ? 'border-red-500' : ''
                    }`}>
                      <SelectValue placeholder="Select your stream" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {streamOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <Code className="h-4 w-4 text-web3-blue" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.stream && (
                    <p className="text-red-400 text-sm">{errors.stream}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-web3-blue" />
                <h3 className="text-lg font-semibold text-white">Student Information</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="text-gray-300 font-medium">
                    Student Name *
                  </Label>
                  <Input
                    id="studentName"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange('studentName', e.target.value)}
                    placeholder="Enter student's full name"
                    className={`bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-web3-blue focus:border-transparent ${
                      errors.studentName ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.studentName && (
                    <p className="text-red-400 text-sm">{errors.studentName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNo" className="text-gray-300 font-medium">
                    Roll Number *
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="rollNo"
                      value={formData.rollNo}
                      onChange={(e) => handleInputChange('rollNo', e.target.value)}
                      placeholder="Enter roll number"
                      className={`pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-web3-blue focus:border-transparent ${
                        errors.rollNo ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  {errors.rollNo && (
                    <p className="text-red-400 text-sm">{errors.rollNo}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gpa" className="text-gray-300 font-medium">
                    GPA (0-10) *
                  </Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.gpa}
                      onChange={(e) => handleInputChange('gpa', e.target.value)}
                      placeholder="Enter GPA"
                      className={`pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-web3-blue focus:border-transparent ${
                        errors.gpa ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  {errors.gpa && (
                    <p className="text-red-400 text-sm">{errors.gpa}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Character Assessment */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="h-5 w-5 text-web3-cyan" />
                <h3 className="text-lg font-semibold text-white">Character Assessment</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="character" className="text-gray-300 font-medium">
                  Character Evaluation *
                </Label>
                <Select value={formData.character} onValueChange={(value) => handleInputChange('character', value)}>
                  <SelectTrigger className={`bg-gray-800/50 border-gray-700 text-white focus:ring-2 focus:ring-web3-cyan ${
                    errors.character ? 'border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Select character assessment" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {characterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-web3-cyan" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.character && (
                  <p className="text-red-400 text-sm">{errors.character}</p>
                )}
              </div>
            </div>

            {/* Blockchain Identity */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Wallet className="h-5 w-5 text-web3-purple" />
                <h3 className="text-lg font-semibold text-white">Blockchain Identity</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="studentDid" className="text-gray-300 font-medium">
                  Student DID (Wallet Address) *
                </Label>
                <Input
                  id="studentDid"
                  value={formData.studentDid}
                  onChange={(e) => handleInputChange('studentDid', e.target.value)}
                  placeholder="Enter student's DID/wallet address"
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-web3-purple focus:border-transparent font-mono text-sm ${
                    errors.studentDid ? 'border-red-500' : ''
                  }`}
                />
                {errors.studentDid && (
                  <p className="text-red-400 text-sm">{errors.studentDid}</p>
                )}
                <p className="text-gray-500 text-xs">This is the blockchain address that will own this credential</p>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="additionalNotes" className="text-gray-300 font-medium">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Add any additional information about this credential..."
                  rows={3}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-web3-purple focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCredentialMutation.isPending}
                className="glow-button text-white px-8 py-2 font-semibold flex items-center"
              >
                {createCredentialMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Credential
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialForm;
