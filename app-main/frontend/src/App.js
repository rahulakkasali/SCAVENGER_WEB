import { useState } from "react";
import "@/App.css";
import { Upload, Download, AlertCircle, CheckCircle, TrendingUp, FileText, Trash2 } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setFileInfo(null);
      setResults(null);
      setShowDeleteConfirm(false);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileInfo(response.data);
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const handleDetectOutliers = async () => {
    if (!fileInfo) return;

    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/detect-outliers`, {
        file_id: fileInfo.file_id,
        threshold_percentile: 95.0
      });
      setResults(response.data);
      toast.success("Outlier detection completed!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error detecting outliers");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!fileInfo || !results) return;

    try {
      const response = await axios.get(`${API}/download-cleaned/${fileInfo.file_id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cleaned_${file.name}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Cleaned dataset downloaded!");
    } catch (error) {
      toast.error("Error downloading cleaned dataset");
    }
  };

  const outlierPercentage = results ? ((results.outliers_count / results.total_records) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/60 border-b border-sky-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Scavenger</h1>
                <p className="text-xs text-slate-600">AI-Powered Outlier Detection</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {!fileInfo && !results && (
          <div className="text-center mb-12 pt-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Clean Your Data with AI
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload your dataset and let our autoencoder neural network identify and remove outliers automatically
            </p>
          </div>
        )}

        {/* Upload Section */}
        <Card className="mb-8 shadow-lg border-sky-200/50" data-testid="upload-card">
          <CardHeader className="bg-gradient-to-r from-sky-100/50 to-cyan-100/50">
            <CardTitle className="flex items-center space-x-2">
              <Upload size={24} className="text-sky-600" />
              <span>Upload Dataset</span>
            </CardTitle>
            <CardDescription>Upload a CSV file to detect and remove outliers</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 w-full">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-sky-300 rounded-lg cursor-pointer hover:bg-sky-50/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-10 h-10 mb-2 text-sky-500" />
                    <p className="text-sm text-slate-600">
                      {file ? file.name : "Click to upload CSV file"}
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                    data-testid="file-input"
                  />
                </label>
              </div>
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white px-8"
                data-testid="upload-button"
              >
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {fileInfo && (
              <Alert className="mt-4 border-green-200 bg-green-50" data-testid="upload-success">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">File Uploaded Successfully</AlertTitle>
                <AlertDescription className="text-green-700">
                  {fileInfo.filename} - {fileInfo.rows} rows, {fileInfo.columns} columns
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Analysis Section */}
        {fileInfo && !results && (
          <Card className="mb-8 shadow-lg border-sky-200/50" data-testid="analyze-card">
            <CardHeader className="bg-gradient-to-r from-cyan-100/50 to-sky-100/50">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp size={24} className="text-cyan-600" />
                <span>Detect Outliers</span>
              </CardTitle>
              <CardDescription>Run autoencoder-based outlier detection on your dataset</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                onClick={handleDetectOutliers}
                disabled={analyzing}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white px-8"
                data-testid="detect-button"
              >
                {analyzing ? "Analyzing..." : "Detect Outliers"}
              </Button>
              {analyzing && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Training autoencoder model...</p>
                  <Progress value={66} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-8">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-sky-200/50" data-testid="total-records-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-800">{results.total_records}</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-red-200/50" data-testid="outliers-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-600">Outliers Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{results.outliers_count}</p>
                  <p className="text-sm text-slate-600 mt-1">{outlierPercentage}% of total</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-green-200/50" data-testid="cleaned-records-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-600">Clean Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{results.cleaned_records}</p>
                  <p className="text-sm text-slate-600 mt-1">{(100 - parseFloat(outlierPercentage)).toFixed(1)}% of total</p>
                </CardContent>
              </Card>
            </div>

            {/* Visualizations */}
            <Card className="shadow-lg border-sky-200/50" data-testid="visualizations-card">
              <CardHeader className="bg-gradient-to-r from-sky-100/50 to-cyan-100/50">
                <CardTitle>Visualizations</CardTitle>
                <CardDescription>Visual analysis of outlier detection results</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Scatter Plot */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-800">Outlier Detection Results</h3>
                  <img
                    src={`data:image/png;base64,${results.visualizations.scatter_plot}`}
                    alt="Scatter Plot"
                    className="w-full rounded-lg shadow-md"
                    data-testid="scatter-plot"
                  />
                </div>

                {/* Error Distribution */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-800">Reconstruction Error Distribution</h3>
                  <img
                    src={`data:image/png;base64,${results.visualizations.error_distribution}`}
                    alt="Error Distribution"
                    className="w-full rounded-lg shadow-md"
                    data-testid="error-distribution"
                  />
                </div>

                {/* Feature Distribution */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-800">Feature-wise Distribution</h3>
                  <img
                    src={`data:image/png;base64,${results.visualizations.feature_distribution}`}
                    alt="Feature Distribution"
                    className="w-full rounded-lg shadow-md"
                    data-testid="feature-distribution"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Download Section */}
            {!showDeleteConfirm ? (
              <Card className="shadow-lg border-orange-200/50" data-testid="confirm-card">
                <CardHeader className="bg-gradient-to-r from-orange-100/50 to-red-100/50">
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle size={24} className="text-orange-600" />
                    <span>Remove Outliers?</span>
                  </CardTitle>
                  <CardDescription>
                    {results.outliers_count} outlier{results.outliers_count !== 1 ? 's' : ''} detected. Do you want to remove them from your dataset?
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
                      data-testid="confirm-remove-button"
                    >
                      <Trash2 size={18} className="mr-2" />
                      Yes, Remove Outliers
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setFileInfo(null);
                        setResults(null);
                      }}
                      className="border-slate-300"
                      data-testid="cancel-button"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-green-200/50" data-testid="download-card">
                <CardHeader className="bg-gradient-to-r from-green-100/50 to-emerald-100/50">
                  <CardTitle className="flex items-center space-x-2">
                    <Download size={24} className="text-green-600" />
                    <span>Download Cleaned Dataset</span>
                  </CardTitle>
                  <CardDescription>Your cleaned dataset is ready for download</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    data-testid="download-button"
                  >
                    <Download size={18} className="mr-2" />
                    Download Cleaned CSV
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-sky-200/50 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600 text-sm">
          <p>Powered by TensorFlow Autoencoder • Scavenger © 2025</p>
        </div>
      </footer>
    </div>
  );
}

export default App;