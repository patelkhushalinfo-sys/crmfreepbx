import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Phone, Upload, PlayCircle, PauseCircle, BarChart3, FileText, Users, Activity } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/campaigns`)
      ]);
      setStats(statsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: "bg-green-500",
      paused: "bg-yellow-500",
      draft: "bg-gray-500",
      completed: "bg-blue-500"
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage your outbound calling campaigns</p>
        </div>
        <Button onClick={() => navigate('/campaigns/new')} size="lg" data-testid="create-campaign-btn">
          <Phone className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="total-campaigns-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
              <FileText className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_campaigns}</div>
            </CardContent>
          </Card>

          <Card data-testid="active-campaigns-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
              <Activity className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active_campaigns}</div>
            </CardContent>
          </Card>

          <Card data-testid="total-calls-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
              <Phone className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_calls}</div>
            </CardContent>
          </Card>

          <Card data-testid="completed-calls-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Calls</CardTitle>
              <BarChart3 className="h-5 w-5 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completed_calls}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card data-testid="campaigns-list-card">
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>View and manage your calling campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No campaigns yet. Create your first campaign to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Caller ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} data-testid={`campaign-row-${campaign.id}`}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>{campaign.caller_id}</TableCell>
                    <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        data-testid={`view-campaign-${campaign.id}`}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trunk_name: "sample_trunk",
    caller_id: "1234567890"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/campaigns`, formData);
      toast.success("Campaign created successfully!");
      navigate(`/campaigns/${response.data.id}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Create New Campaign
        </h1>
        <p className="text-gray-600 mt-2">Set up a new outbound calling campaign</p>
      </div>

      <Card data-testid="create-campaign-form">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Enter the basic information for your campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Survey Q1 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="campaign-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the campaign purpose"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                data-testid="campaign-description-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trunk_name">SIP Trunk Name *</Label>
              <Input
                id="trunk_name"
                placeholder="sample_trunk"
                value={formData.trunk_name}
                onChange={(e) => setFormData({ ...formData, trunk_name: e.target.value })}
                required
                data-testid="trunk-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caller_id">Caller ID *</Label>
              <Input
                id="caller_id"
                placeholder="1234567890"
                value={formData.caller_id}
                onChange={(e) => setFormData({ ...formData, caller_id: e.target.value })}
                required
                data-testid="caller-id-input"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" data-testid="submit-campaign-btn">
                Create Campaign
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/')} data-testid="cancel-btn">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [scriptData, setScriptData] = useState({ script_name: "", script_text: "" });
  const [scripts, setScripts] = useState([]);

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const fetchCampaignData = async () => {
    try {
      const [campaignRes, contactsRes, callsRes, statsRes, scriptsRes] = await Promise.all([
        axios.get(`${API}/campaigns/${id}`),
        axios.get(`${API}/campaigns/${id}/contacts`),
        axios.get(`${API}/campaigns/${id}/calls`),
        axios.get(`${API}/campaigns/${id}/stats`),
        axios.get(`${API}/campaigns/${id}/scripts`)
      ]);
      setCampaign(campaignRes.data);
      setContacts(contactsRes.data);
      setCalls(callsRes.data);
      setStats(statsRes.data);
      setScripts(scriptsRes.data);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      toast.error("Failed to load campaign data");
    }
  };

  const handleFileUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      await axios.post(`${API}/campaigns/${id}/contacts/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Contacts uploaded successfully!");
      setCsvFile(null);
      fetchCampaignData();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Failed to upload contacts");
    }
  };

  const startCampaign = async () => {
    try {
      await axios.post(`${API}/campaigns/${id}/calls/start-campaign`);
      toast.success("Campaign started!");
      fetchCampaignData();
    } catch (error) {
      console.error("Error starting campaign:", error);
      toast.error("Failed to start campaign");
    }
  };

  const stopCampaign = async () => {
    try {
      await axios.post(`${API}/campaigns/${id}/calls/stop`);
      toast.success("Campaign stopped!");
      fetchCampaignData();
    } catch (error) {
      console.error("Error stopping campaign:", error);
      toast.error("Failed to stop campaign");
    }
  };

  const createScript = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/campaigns/${id}/scripts`, scriptData);
      toast.success("Script created successfully!");
      setScriptData({ script_name: "", script_text: "" });
      fetchCampaignData();
    } catch (error) {
      console.error("Error creating script:", error);
      toast.error("Failed to create script");
    }
  };

  if (!campaign) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {campaign.name}
          </h1>
          <p className="text-gray-600 mt-2">{campaign.description || "No description"}</p>
        </div>
        <div className="flex gap-3">
          {campaign.status === 'active' ? (
            <Button onClick={stopCampaign} variant="destructive" data-testid="stop-campaign-btn">
              <PauseCircle className="mr-2 h-4 w-4" /> Stop Campaign
            </Button>
          ) : (
            <Button onClick={startCampaign} data-testid="start-campaign-btn">
              <PlayCircle className="mr-2 h-4 w-4" /> Start Campaign
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card data-testid="campaign-total-contacts">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_contacts}</div>
            </CardContent>
          </Card>

          <Card data-testid="campaign-total-calls">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_calls}</div>
            </CardContent>
          </Card>

          <Card data-testid="campaign-completed-calls">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.completed_calls}</div>
            </CardContent>
          </Card>

          <Card data-testid="campaign-success-rate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.success_rate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts" data-testid="contacts-tab">Contacts</TabsTrigger>
          <TabsTrigger value="calls" data-testid="calls-tab">Call Records</TabsTrigger>
          <TabsTrigger value="scripts" data-testid="scripts-tab">Scripts</TabsTrigger>
          <TabsTrigger value="responses" data-testid="responses-tab">DTMF Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <Card data-testid="upload-contacts-card">
            <CardHeader>
              <CardTitle>Upload Contacts</CardTitle>
              <CardDescription>
                Upload a CSV file with columns: phone_number, first_name, last_name, custom_data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="csv-upload">CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    data-testid="csv-upload-input"
                  />
                </div>
                <Button onClick={handleFileUpload} data-testid="upload-csv-btn">
                  <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="contacts-table-card">
            <CardHeader>
              <CardTitle>Contact List ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No contacts yet. Upload a CSV file to add contacts.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Added Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id} data-testid={`contact-row-${contact.id}`}>
                        <TableCell className="font-medium">{contact.phone_number}</TableCell>
                        <TableCell>{contact.first_name || '-'}</TableCell>
                        <TableCell>{contact.last_name || '-'}</TableCell>
                        <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <Card data-testid="calls-table-card">
            <CardHeader>
              <CardTitle>Call Records ({calls.length})</CardTitle>
              <CardDescription>Real-time monitoring of all calls in this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No calls yet. Start the campaign to begin calling.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>DTMF Response</TableHead>
                      <TableHead>Duration (s)</TableHead>
                      <TableHead>Call Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.id} data-testid={`call-row-${call.id}`}>
                        <TableCell className="font-medium">{call.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant={call.call_status === 'completed' ? 'default' : 'secondary'}>
                            {call.call_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {call.dtmf_response ? (
                            <Badge className="bg-green-500" data-testid={`dtmf-${call.id}`}>
                              {call.dtmf_response}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{call.duration || '-'}</TableCell>
                        <TableCell>{new Date(call.call_time).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card data-testid="create-script-card">
            <CardHeader>
              <CardTitle>Create Call Script</CardTitle>
              <CardDescription>Define what the bot will say during calls</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createScript} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="script-name">Script Name</Label>
                  <Input
                    id="script-name"
                    placeholder="e.g., Welcome Script"
                    value={scriptData.script_name}
                    onChange={(e) => setScriptData({ ...scriptData, script_name: e.target.value })}
                    required
                    data-testid="script-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="script-text">Script Text</Label>
                  <Textarea
                    id="script-text"
                    placeholder="Hello {name}, This is a general call to proceed press 1 otherwise press 2 to decline call"
                    value={scriptData.script_text}
                    onChange={(e) => setScriptData({ ...scriptData, script_text: e.target.value })}
                    rows={6}
                    required
                    data-testid="script-text-input"
                  />
                  <p className="text-sm text-gray-500">Use {'{name}'} to insert customer name dynamically</p>
                </div>
                <Button type="submit" data-testid="create-script-btn">
                  Create Script
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card data-testid="scripts-list-card">
            <CardHeader>
              <CardTitle>Saved Scripts ({scripts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {scripts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No scripts yet. Create your first script above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scripts.map((script) => (
                    <Card key={script.id} data-testid={`script-card-${script.id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg">{script.script_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">{script.script_text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card data-testid="dtmf-responses-card">
            <CardHeader>
              <CardTitle>DTMF Response Breakdown</CardTitle>
              <CardDescription>Summary of customer button presses</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && Object.keys(stats.dtmf_breakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.dtmf_breakdown).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`dtmf-breakdown-${key}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-600">{key}</span>
                        </div>
                        <div>
                          <p className="font-medium">Response: {key}</p>
                          <p className="text-sm text-gray-500">{count} customer{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No responses yet. Start the campaign to collect data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
          <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link to="/" className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    CallBot Manager
                  </span>
                </Link>
                <div className="flex gap-2">
                  <Button variant="ghost" asChild>
                    <Link to="/" data-testid="nav-dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/campaigns/new" data-testid="nav-new-campaign">New Campaign</Link>
                  </Button>
                </div>
              </div>
            </div>
          </nav>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/campaigns/new" element={<CreateCampaign />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;