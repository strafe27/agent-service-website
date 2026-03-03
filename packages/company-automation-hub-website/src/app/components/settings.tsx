import { Bell, Lock, User, Database, Palette, Globe } from 'lucide-react';

export function Settings() {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your AI platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500 p-2 rounded-lg">
                <User size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Account Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                <input
                  type="text"
                  defaultValue="Your Company"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="admin@company.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Retail</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Database size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">API Configuration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">API Endpoint</label>
                <input
                  type="text"
                  defaultValue="https://api.yourcompany.com/v1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    defaultValue="sk-proj-xxxxxxxxxxxxxxxx"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rate Limit (requests/min)</label>
                <input
                  type="number"
                  defaultValue="1000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500 p-2 rounded-lg">
                <Bell size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-600">Receive updates via email</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Agent Alerts</p>
                  <p className="text-sm text-slate-600">Notify when agents encounter errors</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Workflow Updates</p>
                  <p className="text-sm text-slate-600">Get notified of workflow completions</p>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Lock size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Security</h2>
            </div>
            <div className="space-y-4">
              <button className="w-full px-4 py-2 text-left bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Change Password
              </button>
              <button className="w-full px-4 py-2 text-left bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Two-Factor Auth
              </button>
              <button className="w-full px-4 py-2 text-left bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Active Sessions
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-pink-500 p-2 rounded-lg">
                <Palette size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900"></button>
                  <button className="w-8 h-8 rounded-full bg-purple-500 border-2 border-transparent"></button>
                  <button className="w-8 h-8 rounded-full bg-green-500 border-2 border-transparent"></button>
                  <button className="w-8 h-8 rounded-full bg-orange-500 border-2 border-transparent"></button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-teal-500 p-2 rounded-lg">
                <Globe size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Language</h2>
            </div>
            <div>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Japanese</option>
              </select>
            </div>
          </div>

          <button className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}