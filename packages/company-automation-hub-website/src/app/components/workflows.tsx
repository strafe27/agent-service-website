import { useState } from 'react';
import { Play, Pause, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, MoreVertical } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'active' | 'paused' | 'error';
  executions: number;
  lastRun: string;
  successRate: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Customer Onboarding',
    version: 'V1 - Sales Team',
    description: 'Automated welcome sequence for new customers',
    status: 'active',
    executions: 1243,
    lastRun: '5 minutes ago',
    successRate: 98.5,
  },
  {
    id: '2',
    name: 'Lead Qualification',
    version: 'V2 - Marketing Team',
    description: 'AI-powered lead scoring and routing',
    status: 'active',
    executions: 3421,
    lastRun: '12 minutes ago',
    successRate: 96.2,
  },
  {
    id: '3',
    name: 'Email Campaign',
    version: 'V1 - CE Team',
    description: 'Personalized email marketing automation',
    status: 'active',
    executions: 8734,
    lastRun: '1 hour ago',
    successRate: 94.8,
  },
  {
    id: '4',
    name: 'Data Processing',
    version: 'V3 - Risk Team',
    description: 'Batch data transformation and enrichment',
    status: 'paused',
    executions: 542,
    lastRun: '2 days ago',
    successRate: 99.1,
  },
  {
    id: '5',
    name: 'Support Ticket Routing',
    version: 'V1 - Support Team',
    description: 'Intelligent ticket categorization and assignment',
    status: 'active',
    executions: 2156,
    lastRun: '3 minutes ago',
    successRate: 97.3,
  },
  {
    id: '6',
    name: 'Inventory Sync',
    version: 'V2 - Operations Team',
    description: 'Real-time inventory updates across platforms',
    status: 'error',
    executions: 423,
    lastRun: '30 minutes ago',
    successRate: 87.4,
  },
];

export function Workflows() {
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || workflow.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleStatus = (id: string) => {
    setWorkflows(workflows.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          status: w.status === 'active' ? 'paused' : 'active',
        };
      }
      return w;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} />;
      case 'paused':
        return <Pause size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Workflows</h1>
            <p className="text-slate-600 mt-2">Manage and monitor your automated workflows</p>
          </div>
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus size={20} />
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWorkflows.map((workflow) => (
          <div key={workflow.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{workflow.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-medium">{workflow.version}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(workflow.status)}`}>
                {getStatusIcon(workflow.status)}
                {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                {workflow.lastRun}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Executions</p>
                <p className="text-xl font-bold text-slate-900">{workflow.executions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Success Rate</p>
                <p className="text-xl font-bold text-slate-900">{workflow.successRate}%</p>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${workflow.successRate}%` }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleStatus(workflow.id)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  workflow.status === 'active'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {workflow.status === 'active' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Pause size={16} />
                    Pause
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Play size={16} />
                    Resume
                  </span>
                )}
              </button>
              <button className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No workflows found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
