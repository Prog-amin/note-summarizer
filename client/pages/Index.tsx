import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Brain, Mail, Send, Copy, Check, Upload, X, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SummaryResponse {
  summary: string;
  error?: string;
}

interface ShareResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export default function Index() {
  const [transcript, setTranscript] = useState("");
  const [customPrompt, setCustomPrompt] = useState("Summarize this meeting transcript in clear bullet points, highlighting key decisions, action items, and next steps.");
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [emailServiceError, setEmailServiceError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['text/plain', 'text/csv', 'application/json'];
    const isTextFile = allowedTypes.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.md');
    
    if (!isTextFile) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a text file (.txt, .md, .csv, or .json)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingFile(true);
    setUploadedFile(file);

    try {
      const text = await file.text();
      setTranscript(text);
      toast({
        title: "File Uploaded",
        description: `Successfully loaded ${file.name}`,
      });
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Error",
        description: "Failed to read the uploaded file",
        variant: "destructive",
      });
      setUploadedFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setTranscript("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateSummary = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Error",
        description: "Please provide a meeting transcript to summarize.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
          customPrompt: customPrompt.trim(),
        }),
      });

      let data: SummaryResponse;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedSummary(data.summary);
      setEditedSummary(data.summary);
      toast({
        title: "Success",
        description: "Meeting summary generated successfully!",
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const shareViaEmail = async () => {
    if (!editedSummary.trim()) {
      toast({
        title: "Error",
        description: "No summary to share. Please generate a summary first.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientEmails.trim()) {
      toast({
        title: "Error",
        description: "Please provide recipient email addresses.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setEmailServiceError(null);
    
    try {
      const response = await fetch("/api/share-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: editedSummary.trim(),
          // Accept commas, semicolons, or whitespace as separators
          recipients: recipientEmails
            .split(/[\s,;]+/)
            .map(email => email.trim())
            .filter(Boolean),
        }),
      });

      let data: ShareResponse;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.error) {
        // Check if it's a configuration error
        if (data.error.includes("RESEND_API_KEY") || data.error.includes("email service")) {
          setEmailServiceError(data.error);
          return;
        }
        // Check if it's a domain verification error
        if (data.error.includes("verify a domain") || data.error.includes("testing emails")) {
          setEmailServiceError(data.error);
          toast({
            title: "Email Restriction",
            description: "In testing mode, emails can only be sent to your verified email address.",
            variant: "default",
          });
          return;
        }
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: data.message || "Meeting summary shared successfully!",
      });
      setRecipientEmails("");
    } catch (error) {
      console.error("Error sharing summary:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = async () => {
    if (!editedSummary.trim()) {
      toast({
        title: "Nothing to Copy",
        description: "No summary available to copy.",
        variant: "destructive",
      });
      return;
    }

    // Function to use fallback copy method
    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = editedSummary;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          toast({
            title: "Copied",
            description: "Summary copied to clipboard!",
          });
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error("execCommand failed");
        }
      } catch (err) {
        // Final fallback - show the text for manual copy
        toast({
          title: "Copy Manually",
          description: "Please select all text in the summary field and copy it manually (Ctrl+C or Cmd+C).",
          variant: "default",
        });
      } finally {
        document.body.removeChild(textArea);
      }
    };

    // Try modern clipboard API first, but handle permission errors
    try {
      // Check if clipboard API is available and has permission
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(editedSummary);
        setCopied(true);
        toast({
          title: "Copied",
          description: "Summary copied to clipboard!",
        });
        setTimeout(() => setCopied(false), 2000);
        return;
      } else {
        // No clipboard API, use fallback immediately
        fallbackCopy();
        return;
      }
    } catch (error) {
      // If clipboard API fails (permissions, etc.), use fallback
      console.log("Clipboard API failed, using fallback:", error);
      fallbackCopy();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              NoteSummary AI
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your meeting transcripts into clear, actionable summaries with AI-powered intelligence
          </p>
        </div>

        <div className="grid gap-8">
          {/* Input Section */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Meeting Transcript
              </CardTitle>
              <CardDescription>
                Upload a text file or paste your meeting notes, call transcript, or any text you'd like to summarize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div>
                <Label htmlFor="file-upload">Upload Transcript File</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".txt,.md,.csv,.json,text/plain,text/csv,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {!uploadedFile ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                    >
                      {isProcessingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing file...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Click to upload transcript file (.txt, .md, .csv, .json)
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">{uploadedFile.name}</span>
                        <span className="text-xs text-green-500">
                          ({(uploadedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Input Section */}
              <div>
                <Label htmlFor="transcript">Or Paste Transcript Text</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your meeting transcript here...

Example:
John: Good morning everyone. Let's start with the Q4 budget review.
Sarah: I've prepared the financial report. Our expenses increased by 15% this quarter.
Mike: We need to prioritize the marketing campaign for next month.
John: Let's schedule a follow-up meeting for next Tuesday to finalize the budget."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={8}
                  className="mt-2 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Summarize in bullet points for executives, Highlight only action items, etc."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="mt-2 resize-none"
                />
              </div>

              <Button 
                onClick={generateSummary} 
                disabled={isGenerating || !transcript.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary Section */}
          {generatedSummary && (
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    Generated Summary
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={!editedSummary.trim()}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  Review and edit the AI-generated summary before sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="summary">Summary (Editable)</Label>
                  <Textarea
                    id="summary"
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    rows={10}
                    className="mt-2 resize-none"
                  />
                </div>

                {/* Email Service Warning */}
                {emailServiceError && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Email Service Not Configured:</strong> {emailServiceError}
                      <br />
                      <span className="text-sm mt-1 block">
                        Please configure RESEND_API_KEY environment variable to send real emails.
                      </span>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="emails">Share via Email</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="emails"
                      placeholder="Enter email addresses (comma-separated)"
                      value={recipientEmails}
                      onChange={(e) => setRecipientEmails(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={shareViaEmail}
                      disabled={isSending || !editedSummary.trim() || !recipientEmails.trim()}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Share
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Separate multiple email addresses with commas, spaces, or semicolons
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Overview */}
          {!generatedSummary && (
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-3 bg-indigo-100 rounded-full w-fit mx-auto mb-3">
                      <Upload className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Upload or Paste</h3>
                    <p className="text-sm text-gray-600">Upload a text file or paste your meeting notes into the text area.</p>
                  </div>
                  <div className="text-center">
                    <div className="p-3 bg-cyan-100 rounded-full w-fit mx-auto mb-3">
                      <Brain className="h-6 w-6 text-cyan-600" />
                    </div>
                    <h3 className="font-semibold mb-2">2. AI Processing</h3>
                    <p className="text-sm text-gray-600">Our AI analyzes the content and generates a structured summary based on your instructions.</p>
                  </div>
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">3. Share Results</h3>
                    <p className="text-sm text-gray-600">Edit the summary as needed and share it via email with your team.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
