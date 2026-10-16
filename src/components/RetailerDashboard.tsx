import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Activity, 
  Cpu, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Eye, 
  Clock, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Bell, 
  Download, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Edit3,
  Search,
  Filter,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Database,
  Lock,
  Sun,
  Moon,
  Layout,
  Layers,
  Sparkles,
  RefreshCw,
  MoreVertical,
  ShoppingCart,
  User,
  History,
  Mail,
  Send,
  MousePointer2,
  AlertTriangle,
  FileDown,
  Megaphone,
  Briefcase,
  Target,
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  Globe,
  Tag
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  RETAILER_STATS, 
  LIVE_ACTIVITY, 
  PRODUCT_INTEL, 
  RETAILER_OUTFITS, 
  USAGE_CHART_DATA,
  TREND_CHART_DATA,
  CAMPAIGNS
} from "../retailerData";
import { Category, CatalogItem, LiveActivity as LiveActivityType } from "../types";
import { CATALOG_ITEMS } from "../constants";

// --- Components ---

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, isDark }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-[32px] border shadow-sm transition-colors duration-300 ${
      isDark ? 'bg-navy border-white/10 text-white' : 'bg-white border-cool-gray/10 text-navy'
    }`}
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>
        {title}
      </p>
      <p className="text-3xl font-display font-bold mt-1">{value}</p>
    </div>
  </motion.div>
);

const ChartCard = ({ title, children, icon: Icon, isDark }: any) => (
  <div className={`p-8 rounded-[40px] border shadow-sm transition-colors duration-300 ${
    isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'
  }`}>
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-cool-gray'}`} />}
        <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-navy'}`}>{title}</h3>
      </div>
      <button className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-cool-gray/5'}`}>
        <MoreVertical className="w-4 h-4 text-cool-gray" />
      </button>
    </div>
    <div className="h-[300px] w-full">
      {children}
    </div>
  </div>
);

export const RetailerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDark, setIsDark] = useState(false);
  const [liveLog, setLiveLog] = useState<LiveActivityType[]>(LIVE_ACTIVITY);
  const [products, setProducts] = useState(PRODUCT_INTEL);
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<string>("All");
  const [outfits, setOutfits] = useState(RETAILER_OUTFITS);
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState(RETAILER_STATS);
  const [isUploading, setIsUploading] = useState(false);

  // Filtered products based on search and style
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = `${p.brand} ${p.category} ${p.silhouette}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = styleFilter === "All" || p.formality === styleFilter || (styleFilter === "Streetwear" && p.silhouette.includes("Oversized"));
      return matchesSearch && matchesStyle;
    });
  }, [products, searchQuery, styleFilter]);

  // Simulated Database Upload
  const handleDatabaseUpload = (type: 'csv' | 'json') => {
    setIsUploading(true);
    // Simulate parsing and importing
    setTimeout(() => {
      const newItems = CATALOG_ITEMS.slice(10, 15).map((item, idx) => ({
        ...item,
        id: `uploaded-${Date.now()}-${idx}`,
        views: Math.floor(Math.random() * 500),
        repeatViews: Math.floor(Math.random() * 100),
        avgDwellTime: "12s",
        conversionScore: 45,
        aiLabel: "Trending" as const,
        visibilityBoost: 0,
        isAutoOptimized: false
      }));
      setProducts(prev => [...newItems, ...prev]);
      setIsUploading(false);
      setActiveTab('products');
    }, 2000);
  };

  // Simulated Live Activity Feed logic
  useEffect(() => {
    if (!isLive) return;

    const actions = [
      "viewed Midnight Silk Dress",
      "generated Business casual outfit",
      "clicked purchase link: Tech Joggers",
      "added White Linen Shirt to cart",
      "shared Minimalist collection",
      "updated style profile",
      "dwell on Velvet Blazer (>30s)",
      "saved recommendation: 'Office Chic'"
    ];

    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomUser = `User #${Math.floor(Math.random() * 900) + 100}`;
      const newActivity: LiveActivityType = {
        id: Math.random().toString(),
        user: randomUser,
        action: randomAction,
        timestamp: "now",
        intent: Math.random() > 0.7 ? "high" : "medium"
      };

      setLiveLog(prev => [newActivity, ...prev.slice(0, 9)]);
      
      // Update stats slightly to show movement
      setStats(prev => ({
        ...prev,
        totalInteractions: prev.totalInteractions + 1,
        activeUsersToday: prev.activeUsersToday + (Math.random() > 0.5 ? 1 : -1),
        aiInferences: prev.aiInferences + 1,
        estimatedCost: prev.estimatedCost + 0.001
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const COLORS = ['#2DD4BF', '#6366f1', '#ec4899', '#f59e0b'];

  const exportCSV = () => {
    const headers = ["ID", "Brand", "Category", "Views", "Conversion", "Label"];
    const rows = products.map(p => [p.id, p.brand, p.category, p.views, p.conversionScore, p.aiLabel]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "retailer_intelligence_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductBoost = (id: string, val: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, visibilityBoost: val } : p));
  };

  const toggleAutoOptimize = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isAutoOptimized: !p.isAutoOptimized } : p));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 pt-24 pb-20 px-6 lg:px-12 ${isDark ? 'bg-navy' : 'bg-[#fafafa]'}`}>
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${isDark ? 'bg-white text-navy' : 'bg-navy text-white'}`}>Enterprise</span>
              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>v4.5.12-demo</span>
            </div>
            <h1 className={`text-4xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>
              Retailer Intelligence
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-cool-gray'}`}>
              Powered by Aura AI Engine • Tracking <span className={isDark ? 'text-white font-bold' : 'text-navy font-bold'}>Luxe Collective Storefront</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsDark(!isDark)}
               className={`p-3 rounded-2xl border shadow-sm transition-all ${
                 isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-cool-gray/10 text-navy hover:bg-cool-gray/5'
               }`}
             >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button 
               onClick={exportCSV}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl border shadow-sm font-bold text-sm transition-all ${
                 isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-cool-gray/10 text-navy hover:bg-cool-gray/5'
               }`}
             >
                <FileDown className="w-4 h-4" />
                Export CSV
             </button>
             <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all fashion-shadow shadow-lg">
                <Settings className="w-4 h-4" />
                Settings
             </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-1 p-1.5 rounded-[24px] border w-fit shadow-sm overflow-x-auto no-scrollbar transition-colors ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-cool-gray/10'
        }`}>
          {[
            { id: "overview", label: "Dashboard", icon: BarChart3 },
            { id: "products", label: "Product Intelligence", icon: ShoppingBag },
            { id: "inventory", label: "Inventory DB", icon: Database },
            { id: "outfits", label: "Outfits", icon: Layers },
            { id: "marketing", label: "Marketing Hub", icon: Megaphone },
            { id: "ai", label: "AI Engine", icon: Cpu },
            { id: "performance", label: "System", icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-accent text-white fashion-shadow" 
                  : (isDark ? 'text-white/40 hover:text-white' : 'text-cool-gray hover:text-navy')
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} trend="up" trendValue="+12%" color="bg-soft-blue" isDark={isDark} />
                <StatCard title="Active Session" value={stats.activeUsersToday.toLocaleString()} icon={Activity} trend="up" trendValue="+5.2%" color="bg-emerald-500" isDark={isDark} />
                <StatCard title="AI Content Generated" value={stats.aiInferences.toLocaleString()} icon={Cpu} trend="up" trendValue="+18%" color="bg-purple-500" isDark={isDark} />
                <StatCard title="Rev. Opportunity" value={`$${stats.revenueOpportunity.toLocaleString()}`} icon={DollarSign} trend="up" trendValue="+22%" color="bg-amber-500" isDark={isDark} />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Usage Chart */}
                <div className="lg:col-span-2">
                  <ChartCard title="AI Engagement Matrix" icon={Activity} isDark={isDark}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={USAGE_CHART_DATA}>
                        <defs>
                          <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.4)' : '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.4)' : '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#0B1F3B' : '#fff',
                            borderRadius: '20px', 
                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                          }}
                        />
                        <Area type="monotone" dataKey="calls" stroke="#2DD4BF" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Live Activity Feed */}
                <div className={`p-8 rounded-[40px] border shadow-sm flex flex-col transition-colors ${
                  isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'
                }`}>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-navy'}`}>Live Stream</h3>
                    </div>
                    <button 
                      onClick={() => setIsLive(!isLive)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                        isLive ? 'border-accent/20 text-accent bg-accent/5' : 'border-cool-gray/20 text-cool-gray'
                      }`}
                    >
                      {isLive ? 'Online' : 'Standby'}
                    </button>
                  </div>
                  <div className="flex-1 space-y-5 overflow-hidden">
                    <AnimatePresence initial={false}>
                      {liveLog.map((log) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          key={log.id} 
                          className="flex items-start gap-4 p-3 rounded-2xl transition-all group"
                        >
                          <div className={`mt-1.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                             log.intent === 'high' ? 'bg-accent/20 text-accent group-hover:scale-110' : (isDark ? 'bg-white/10 text-white/40' : 'bg-cool-gray/10 text-cool-gray')
                          }`}>
                             {log.action.includes('viewed') ? <Eye className="w-4 h-4" /> : 
                              log.action.includes('generated') ? <Sparkles className="w-4 h-4" /> :
                              log.action.includes('clicked') ? <ShoppingCart className="w-4 h-4" /> :
                              log.action.includes('cart') ? <ShoppingBag className="w-4 h-4" /> :
                              <Activity className="w-4 h-4" />}
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-navy'}`}>
                              <span className={isDark ? 'text-white/40 font-normal' : 'text-cool-gray font-normal'}>{log.user} </span>
                              {log.action}
                            </p>
                            <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? 'text-white/20' : 'text-cool-gray/60'}`}>{log.timestamp}</span>
                               {log.intent === 'high' && (
                                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-md">Signal+</span>
                               )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <button className={`w-full mt-8 py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isDark ? 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10' : 'bg-cool-gray/5 border-cool-gray/10 text-cool-gray hover:bg-cool-gray/10'
                  }`}>
                    Analyze Historical behavior
                  </button>
                </div>
              </div>

              {/* Trends & Patterns */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                   <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-navy'}`}>Trending Colors</h3>
                   <div className="space-y-5">
                      {[
                        { color: "Navy Blue", percent: 42, hex: "#1e3a8a" },
                        { color: "Emerald Green", percent: 28, hex: "#065f46" },
                        { color: "Soft Beige", percent: 18, hex: "#f5f5dc" },
                        { color: "Terracotta", percent: 12, hex: "#9a3412" }
                      ].map(item => (
                        <div key={item.color} className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: item.hex }} />
                                 <span className={isDark ? 'text-white/60' : 'text-cool-gray'}>{item.color}</span>
                              </div>
                              <span className={isDark ? 'text-white' : 'text-navy'}>{item.percent}%</span>
                           </div>
                           <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-cool-gray/5'}`}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} className="h-full bg-accent" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                   <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-navy'}`}>High-Intent Clusters</h3>
                   <div className="space-y-4">
                      {[
                        { cluster: "Streetwear Enthusiasts", users: 1240, lift: "+24%" },
                        { cluster: "Minimalist Professionals", users: 890, lift: "+18%" },
                        { cluster: "Sustainable Seasonal", users: 560, lift: "+9%" }
                      ].map(item => (
                        <div key={item.cluster} className={`p-4 rounded-3xl border transition-colors ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-cool-gray/5 border-cool-gray/10 hover:bg-cool-gray/10 text-navy'}`}>
                           <p className="text-sm font-bold">{item.cluster}</p>
                           <div className="flex justify-between items-center mt-1">
                              <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>{item.users} Active Users</span>
                              <span className="text-xs font-bold text-emerald-500">{item.lift} Lift</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="p-8 rounded-[40px] bg-accent text-navy space-y-8 fashion-shadow relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                   <div>
                      <h3 className="text-2xl font-display font-bold mb-2">Demand Forecast</h3>
                      <p className="text-navy/60 text-sm">AI prediction based on global search & local inventory speed.</p>
                   </div>
                   <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-4 p-4 rounded-[28px] bg-white/20 backdrop-blur-md border border-white/30">
                         <TrendingUp className="w-10 h-10" />
                         <div>
                            <p className="text-lg font-bold">Linen Shirts</p>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Exp. Growth: +400%</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-[28px] bg-white/20 backdrop-blur-md border border-white/30">
                         <Activity className="w-10 h-10" />
                         <div>
                            <p className="text-lg font-bold">Smart Blazers</p>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Status: Saturated</p>
                         </div>
                      </div>
                   </div>
                   <button className="w-full py-4 rounded-2xl bg-navy text-white font-bold text-xs uppercase tracking-widest">Generate Inventory Plan</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                   <h2 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Product Intelligence</h2>
                   <p className={`text-sm ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Analyzing performance across {products.length} SKUs</p>
                 </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-gray" />
                       <input 
                         type="text" 
                         placeholder="Filter catalog..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className={`pl-12 pr-6 py-4 rounded-2xl border focus:outline-none focus:ring-2 ring-accent/20 text-sm transition-colors ${
                           isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-cool-gray/10 text-navy'
                         }`}
                       />
                    </div>
                 </div>
              </div>

              {/* Style-Based Intelligence Search */}
              <div className="flex flex-wrap items-center gap-3">
                 <span className={`text-[10px] font-bold uppercase tracking-widest mr-2 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Style Engine:</span>
                 {["All", "Formal", "Streetwear", "Casual", "Smart Casual"].map(style => (
                    <button
                      key={style}
                      onClick={() => setStyleFilter(style)}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        styleFilter === style 
                          ? "bg-navy text-white border-navy" 
                          : (isDark ? 'bg-white/5 border-white/10 text-white/60 hover:border-white/20' : 'bg-white border-cool-gray/10 text-cool-gray hover:border-accent')
                      }`}
                    >
                      {style}
                    </button>
                 ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <motion.div 
                    key={product.id}
                    layout
                    whileHover={{ y: -5 }}
                    className={`group rounded-[40px] border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
                      isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'
                    }`}
                  >
                    <div className="aspect-[3/4] overflow-hidden relative">
                       <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                       <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <span className={`px-4 py-1.5 rounded-2xl text-[8px] font-bold uppercase tracking-widest text-white shadow-lg ${
                            product.aiLabel === 'High Intent' ? 'bg-emerald-500' :
                            product.aiLabel === 'Trending' ? 'bg-accent' :
                            product.aiLabel === 'Low Engagement' ? 'bg-amber-500' : 'bg-cool-gray'
                          }`}>
                            {product.aiLabel}
                          </span>
                       </div>
                       <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button className="w-14 h-14 rounded-full bg-white text-navy flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-xl">
                             <TrendingUp className="w-6 h-6" />
                          </button>
                          <button className="w-14 h-14 rounded-full bg-white text-navy flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
                             <XCircle className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                    <div className="p-8 space-y-6">
                       <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>{product.brand}</p>
                          <h4 className={`font-display font-bold truncate text-lg ${isDark ? 'text-white' : 'text-navy'}`}>{product.category} • {product.silhouette}</h4>
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <p className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? 'text-white/40' : 'text-cool-gray/60'}`}>Views</p>
                             <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{product.views.toLocaleString()}</p>
                          </div>
                          <div className="space-y-1 text-right">
                             <p className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? 'text-white/40' : 'text-cool-gray/60'}`}>Conv. Score</p>
                             <p className="text-xl font-bold text-emerald-500">{product.conversionScore}%</p>
                          </div>
                       </div>
                       <div className={`pt-6 border-t space-y-5 ${isDark ? 'border-white/5' : 'border-cool-gray/5'}`}>
                          <div className="space-y-3">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className={isDark ? 'text-white/40' : 'text-cool-gray'}>Visibility Boost</span>
                                <span className="text-accent">{product.visibilityBoost}%</span>
                             </div>
                             <input 
                               type="range" 
                               min="0" 
                               max="100" 
                               value={product.visibilityBoost} 
                               onChange={(e) => handleProductBoost(product.id, parseInt(e.target.value))}
                               className="w-full h-1 bg-accent/20 rounded-lg appearance-none cursor-pointer accent-accent" 
                             />
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Auto-Optimize</span>
                             </div>
                             <button 
                               onClick={() => toggleAutoOptimize(product.id)}
                               className={`w-12 h-6 rounded-full transition-all relative ${product.isAutoOptimized ? 'bg-accent shadow-[0_0_15px_rgba(45,212,191,0.4)]' : 'bg-cool-gray/20'}`}
                             >
                                <motion.div animate={{ x: product.isAutoOptimized ? 24 : 0 }} className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all`} />
                             </button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              key="inventory"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-12"
            >
               <div className="max-w-4xl mx-auto text-center space-y-6">
                  <div className={`w-20 h-20 rounded-[32px] mx-auto flex items-center justify-center transition-colors ${isDark ? 'bg-white/5' : 'bg-navy/5'}`}>
                      <Database className={`w-10 h-10 ${isDark ? 'text-white' : 'text-navy'}`} />
                  </div>
                  <div className="space-y-2">
                    <h2 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Import Product Database</h2>
                    <p className={`text-sm max-w-sm mx-auto ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>
                      Upload your inventory CSV or JSON files to train Aura's AI on your specific catalog.
                    </p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <button 
                    onClick={() => handleDatabaseUpload('csv')}
                    disabled={isUploading}
                    className={`p-10 rounded-[48px] border-2 border-dashed transition-all flex flex-col items-center gap-6 group relative overflow-hidden ${
                      isDark ? 'bg-white/5 border-white/10 hover:border-accent hover:bg-white/10' : 'bg-white border-cool-gray/10 hover:border-accent hover:bg-cool-gray/5'
                    }`}
                  >
                     {isUploading && <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                     </div>}
                     <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="w-8 h-8" />
                     </div>
                     <div className="space-y-1">
                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Upload CSV</p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Standard Shopify/Magento format</p>
                     </div>
                  </button>

                  <button 
                    onClick={() => handleDatabaseUpload('json')}
                    disabled={isUploading}
                    className={`p-10 rounded-[48px] border-2 border-dashed transition-all flex flex-col items-center gap-6 group relative overflow-hidden ${
                      isDark ? 'bg-white/5 border-white/10 hover:border-accent hover:bg-white/10' : 'bg-white border-cool-gray/10 hover:border-accent hover:bg-cool-gray/5'
                    }`}
                  >
                     {isUploading && <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                     </div>}
                     <div className="w-16 h-16 rounded-full bg-soft-blue/10 flex items-center justify-center text-soft-blue group-hover:scale-110 transition-transform">
                        <FileJson className="w-8 h-8" />
                     </div>
                     <div className="space-y-1">
                        <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Upload JSON</p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Direct API data dump</p>
                     </div>
                  </button>
               </div>

               <div className={`max-w-4xl mx-auto p-10 rounded-[48px] border transition-colors ${
                 isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'
               }`}>
                  <div className="flex items-center gap-4 mb-8">
                     <Globe className="w-6 h-6 text-accent" />
                     <h3 className={`text-xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Global Sync Channels</h3>
                  </div>
                  <div className="space-y-4">
                     {[
                       { name: "Shopify Storefront", status: "Connected", lastSync: "24m ago" },
                       { name: "Amazon Marketplace", status: "Standby", lastSync: "2h ago" },
                       { name: "Custom POS API", status: "Disconnected", lastSync: "N/A" }
                     ].map(channel => (
                        <div key={channel.name} className={`flex items-center justify-between p-6 rounded-3xl border ${
                          isDark ? 'bg-white/5 border-white/5' : 'bg-cool-gray/5 border-cool-gray/5'
                        }`}>
                           <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${
                                channel.status === 'Connected' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                                channel.status === 'Standby' ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              <div>
                                 <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-navy'}`}>{channel.name}</p>
                                 <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/60'}`}>Status: {channel.status}</p>
                              </div>
                           </div>
                           <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/60'}`}>Last Sync: {channel.lastSync}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'outfits' && (
            <motion.div 
              key="outfits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                   <h2 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>AI-Curated Pairings</h2>
                   <p className={`text-sm ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Reviewing current merchant recommendations</p>
                 </div>
                 <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-navy text-white font-bold text-sm shadow-xl fashion-shadow">
                    <Plus className="w-5 h-5 text-accent" />
                    New Outfit Strategy
                 </button>
               </div>

               <div className="grid gap-8">
                  {outfits.map(outfit => (
                    <div key={outfit.id} className={`rounded-[48px] border p-8 flex flex-col lg:flex-row gap-12 items-center shadow-sm transition-colors ${
                      isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'
                    }`}>
                       <div className="flex -space-x-12 shrink-0">
                          {outfit.items.map((item, idx) => (
                            <motion.div 
                              key={idx} 
                              whileHover={{ y: -10, scale: 1.05 }}
                              className="w-40 h-56 rounded-3xl overflow-hidden border-8 border-white shadow-2xl relative" 
                              style={{ zIndex: 10 - idx }}
                            >
                               <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                            </motion.div>
                          ))}
                       </div>
                       <div className="flex-1 space-y-8 pt-4 lg:pt-0">
                          <div className="space-y-3">
                             <div className="flex flex-wrap gap-3">
                                <span className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${
                                  outfit.status === 'Approved' ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg' : 'bg-amber-500 text-white shadow-amber-500/20 shadow-lg'
                                }`}>
                                  {outfit.status === 'Approved' ? 'Production Ready' : 'Awaiting Review'}
                                </span>
                                <span className={`px-5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] ${
                                  isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-cool-gray/5 border-cool-gray/10 text-cool-gray'
                                }`}>
                                  SS'24 Signature Collection
                                </span>
                             </div>
                             <h4 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Essential Silk & Denim Pairing</h4>
                             <p className={`text-sm leading-relaxed max-w-xl ${isDark ? 'text-white/60' : 'text-cool-gray'}`}>
                               High-performance AI generated outfit with specific synergy detected between textures. Recommended by the engine for "Corporate Minimalist" personas.
                             </p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                             {[
                               { label: "Total Views", value: outfit.clicks.toLocaleString() },
                               { label: "AI Confidence", value: "94%" },
                               { label: "Purchase Intent", value: "High" },
                               { label: "Synergy Score", value: "8.8" }
                             ].map(item => (
                               <div key={item.label} className={`p-5 rounded-3xl text-center border ${isDark ? 'bg-white/5 border-white/5' : 'bg-cool-gray/5 border-cool-gray/5'}`}>
                                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>{item.label}</p>
                                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{item.value}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="flex lg:flex-col gap-4 w-full lg:w-auto">
                          <button className="flex-1 lg:p-5 p-4 rounded-2xl bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/40 transition-all flex items-center justify-center">
                             <CheckCircle2 className="w-7 h-7" />
                          </button>
                          <button className={`flex-1 lg:p-5 p-4 rounded-2xl border transition-all flex items-center justify-center ${
                            isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-cool-gray/10 text-navy hover:bg-cool-gray/5'
                          }`}>
                             <Edit3 className="w-7 h-7" />
                          </button>
                          <button className="flex-1 lg:p-5 p-4 rounded-2xl bg-red-500 text-white shadow-lg hover:shadow-red-500/40 transition-all flex items-center justify-center">
                             <XCircle className="w-7 h-7" />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'marketing' && (
            <motion.div 
              key="marketing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
               <div className="grid lg:grid-cols-2 gap-12">
                  {/* Campaign Hub */}
                  <div className={`p-10 rounded-[48px] border shadow-sm space-y-8 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <Zap className="w-7 h-7 text-amber-500" />
                           <h3 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Campaign Intelligence</h3>
                        </div>
                        <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-full">AI Recommended</span>
                     </div>
                     <div className="space-y-6">
                        {CAMPAIGNS.map(camp => (
                          <div key={camp.id} className={`p-8 rounded-[40px] border transition-all group cursor-pointer ${
                            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-cool-gray/5 border-cool-gray/10 hover:bg-cool-gray/10'
                          }`}>
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <h4 className={`text-xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{camp.name}</h4>
                                      <span className={`text-[8px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                        camp.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-cool-gray/20 text-cool-gray'
                                      }`}>{camp.status}</span>
                                   </div>
                                   <p className={`text-sm max-w-md ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>{camp.description}</p>
                                </div>
                                <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isDark ? 'bg-white/10 text-white hover:bg-accent' : 'bg-navy text-white hover:bg-accent'
                                }`}>
                                   <Send className="w-4 h-4" />
                                </button>
                             </div>
                             <div className="grid grid-cols-3 gap-8">
                                <div>
                                   <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Audience</p>
                                   <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{camp.audience}</p>
                                </div>
                                <div>
                                   <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Exp. Conv</p>
                                   <p className="text-2xl font-display font-bold text-emerald-500">{camp.conversion}</p>
                                </div>
                                <div>
                                   <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Est. Revenue</p>
                                   <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{camp.revenue}</p>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* High Intent Users & Email Preview */}
                  <div className="space-y-12">
                     <div className={`p-10 rounded-[48px] border shadow-sm space-y-8 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                        <div className="flex justify-between items-center">
                           <h3 className={`text-2xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>Smart Outreach</h3>
                           <button className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-cool-gray/5 text-cool-gray'}`}>
                              <RefreshCw className="w-5 h-5" />
                           </button>
                        </div>
                        <div className={`p-8 rounded-[40px] shadow-2xl relative overflow-hidden transition-colors ${
                          isDark ? 'bg-[#152a4a] text-white border border-white/10' : 'bg-[#f8fafc] text-navy border border-cool-gray/5'
                        }`}>
                           <div className="space-y-6 relative z-10">
                              <div className="flex items-center gap-4 border-b pb-6 border-white/10">
                                 <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white">
                                    <Mail className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dynamic Template</p>
                                    <p className="text-xl font-display font-bold">Personalized Weekly Curations</p>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div className="h-4 w-full bg-current opacity-10 rounded-full" />
                                 <div className="h-4 w-2/3 bg-current opacity-10 rounded-full" />
                                 <div className="flex gap-4 pt-4">
                                    <div className="w-24 h-32 bg-current opacity-5 rounded-2xl border-2 border-dashed border-current/20 flex flex-col items-center justify-center gap-2">
                                       <img src={CATALOG_ITEMS[0].imageUrl} className="w-12 h-16 object-cover rounded-md" />
                                       <span className="text-[8px] font-bold uppercase">Dynamic Item 1</span>
                                    </div>
                                    <div className="w-24 h-32 bg-current opacity-5 rounded-2xl border-2 border-dashed border-current/20 flex flex-col items-center justify-center gap-2">
                                       <img src={CATALOG_ITEMS[3].imageUrl} className="w-12 h-16 object-cover rounded-md" />
                                       <span className="text-[8px] font-bold uppercase">Dynamic Item 2</span>
                                    </div>
                                 </div>
                              </div>
                              <button className="w-full py-5 rounded-[28px] bg-accent text-white font-bold text-sm uppercase tracking-widest fashion-shadow shadow-xl">Deploy Automatic Curation</button>
                           </div>
                           <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-10 blur-3xl -mr-16 -mt-16" />
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
               <div className="grid lg:grid-cols-3 gap-12">
                  <div className={`lg:col-span-2 p-10 rounded-[48px] border shadow-sm space-y-10 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <Cpu className="w-7 h-7 text-accent" />
                           <h3 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Global Infrastructure</h3>
                        </div>
                        <div className="flex gap-2">
                           <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase rounded-full border border-emerald-500/20">Operational</span>
                           <span className="px-3 py-1 bg-soft-blue/10 text-soft-blue text-[8px] font-bold uppercase rounded-full border border-soft-blue/20">Scaling v2.1</span>
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                           <div>
                              <h4 className={`text-lg font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>Cluster Health</h4>
                              <p className={`text-sm ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Real-time resource allocation and process health.</p>
                           </div>
                           <div className="space-y-6">
                              {[
                                { name: "Inference Node 01", load: 68, status: "Active" },
                                { name: "Vector Database A", load: 42, status: "Syncing" },
                                { name: "NLP Service Core", load: 12, status: "Standby" }
                              ].map(node => (
                                <div key={node.name} className="space-y-2">
                                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                      <span className={isDark ? 'text-white/60' : 'text-cool-gray'}>{node.name}</span>
                                      <span className="text-accent">{node.load}% Load</span>
                                   </div>
                                   <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-cool-gray/5'}`}>
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${node.load}%` }} className="h-full bg-accent" />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className={`p-8 rounded-[40px] border shadow-inner flex flex-col justify-center items-center text-center space-y-6 ${
                          isDark ? 'bg-[#152a4a] border-white/10' : 'bg-[#f8fafc] border-cool-gray/5'
                        }`}>
                           <div className="w-24 h-24 rounded-full border-4 border-accent flex items-center justify-center relative">
                              <ShieldCheck className="w-10 h-10 text-accent" />
                              <div className="absolute inset-0 border-4 border-accent/30 rounded-full animate-ping" />
                           </div>
                           <div>
                              <p className={`text-xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Zero Trust AI Policy</p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>AES-256 Encryption Active</p>
                           </div>
                           <p className={`text-xs max-w-[200px] leading-relaxed ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>All style data is anonymized before being processed by the global model.</p>
                        </div>
                     </div>
                  </div>

                  <div className={`p-8 rounded-[40px] border shadow-sm space-y-8 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                     <div className="flex items-center gap-3">
                        <DollarSign className="w-6 h-6 text-emerald-500" />
                        <h3 className={`text-xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-navy'}`}>Usage Efficiency</h3>
                     </div>
                     <div className="space-y-10">
                        <div className="text-center">
                           <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Estimated Monthly savings</p>
                           <p className="text-5xl font-display font-bold text-accent">$1,250</p>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">Via Smart Caching</p>
                        </div>
                        <div className="space-y-4">
                           {[
                             { label: "Token Consumption", val: "Lo-Fi 3.2" },
                             { label: "Requests per Session", val: "12.4" },
                             { label: "Cost per Inference", val: "$0.0001" }
                           ].map(item => (
                             <div key={item.label} className={`flex justify-between items-center p-4 rounded-2xl border ${
                               isDark ? 'bg-white/5 border-white/5' : 'bg-cool-gray/5 border-cool-gray/5'
                             }`}>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>{item.label}</span>
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{item.val}</span>
                             </div>
                           ))}
                        </div>
                        <button className="w-full py-4 rounded-lx bg-navy text-white font-bold text-xs uppercase tracking-widest shadow-xl">Inference Settings</button>
                     </div>
                  </div>
               </div>

               {/* A/B Testing Section */}
               <div className={`p-10 rounded-[48px] border shadow-sm space-y-8 ${isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'}`}>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <RefreshCw className="w-7 h-7 text-soft-blue" />
                        <h3 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>A/B Strategy Experiments</h3>
                     </div>
                     <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-bold text-xs uppercase tracking-widest shadow-lg">
                        <Plus className="w-4 h-4" />
                        New Experiment
                     </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-12">
                     <div className={`p-8 rounded-[40px] border relative overflow-hidden transition-all ${
                       isDark ? 'bg-white/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-500/20'
                     }`}>
                        <div className="flex justify-between items-start mb-6">
                           <div className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-bold uppercase rounded-full">Winner</div>
                           <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>Current Control</span>
                        </div>
                        <h4 className={`text-xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>Personal Preference First</h4>
                        <p className={`text-sm mb-6 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Matching items primarily based on user's manual style profile settings.</p>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Conversion</p>
                              <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>12.4%</p>
                           </div>
                           <div className="space-y-1">
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Avg Order</p>
                              <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>$184</p>
                           </div>
                        </div>
                     </div>
                     
                     <div className={`p-8 rounded-[40px] border relative transition-all ${
                       isDark ? 'bg-white/5 border-white/5' : 'bg-white border-cool-gray/10'
                     }`}>
                        <div className="flex justify-between items-start mb-6">
                           <div className="px-3 py-1 bg-soft-blue text-white text-[8px] font-bold uppercase rounded-full">Challenger</div>
                           <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Exp #42-B</span>
                        </div>
                        <h4 className={`text-xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-navy'}`}>Trend-Augmented Match</h4>
                        <p className={`text-sm mb-6 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Injecting 20% trending items outside user profile into local recommendations.</p>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Conversion</p>
                              <p className="text-2xl font-display font-bold text-soft-blue">14.8%</p>
                           </div>
                           <div className="space-y-1">
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-cool-gray/40'}`}>Lift</p>
                              <p className="text-2xl font-display font-bold text-soft-blue">+19.3%</p>
                           </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-cool-gray/5">
                           <button className="w-full py-4 rounded-3xl bg-soft-blue text-white font-bold text-xs uppercase tracking-widest fashion-shadow shadow-soft-blue/20">Rollout to 100%</button>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div 
               key="system"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-12"
            >
               <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { label: "Engine Latency", val: "124ms", trend: "down", color: "text-emerald-500" },
                    { label: "Uptime (30d)", val: "99.98%", trend: "up", color: "text-navy" },
                    { label: "Active Jobs", val: "42", trend: "stable", color: "text-accent" }
                  ].map(stat => (
                    <div key={stat.label} className={`p-10 rounded-[48px] border shadow-sm transition-colors ${
                      isDark ? 'bg-navy border-white/10' : 'bg-white border-cool-gray/10'
                    }`}>
                       <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>{stat.label}</p>
                       <p className={`text-4xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{stat.val}</p>
                       <div className={`mt-4 h-1 rounded-full w-full opacity-20 ${stat.color === 'text-navy' && isDark ? 'bg-white' : 'bg-current'}`} />
                    </div>
                  ))}
               </div>

               <div className={`p-12 rounded-[56px] border shadow-sm flex flex-col md:flex-row gap-16 transition-colors ${
                 isDark ? 'bg-white/5 border-white/10' : 'bg-white border-cool-gray/10'
               }`}>
                  <div className="flex-1 space-y-8">
                     <div>
                        <h3 className={`text-3xl font-display font-bold mb-4 ${isDark ? 'text-white' : 'text-navy'}`}>System Alerts</h3>
                        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Managed notifications for critical inventory and system shifts.</p>
                     </div>
                     <div className="space-y-4">
                        {[
                          { type: "Warning", msg: "Inventory skew detected for 'Linen' category (+40%)", time: "2m ago" },
                          { type: "Info", msg: "New AI model slice successfully deployed to Cluster A", time: "15m ago" },
                          { type: "Critical", msg: "API Rate limit approaching (92%) for region US-EAST", time: "1h ago" }
                        ].map((alert, idx) => (
                          <div key={idx} className={`p-6 rounded-[32px] border flex items-center justify-between gap-6 ${
                            alert.type === 'Critical' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                            alert.type === 'Warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
                            (isDark ? 'bg-white/5 border-white/5 text-white/60' : 'bg-cool-gray/5 border-cool-gray/5 text-cool-gray')
                          }`}>
                             <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${
                                  alert.type === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                  alert.type === 'Warning' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                  'bg-white/40'
                                }`} />
                                <div>
                                   <p className="text-sm font-bold">{alert.msg}</p>
                                   <p className="text-[10px] font-bold uppercase mt-0.5 opacity-60">{alert.time}</p>
                                </div>
                             </div>
                             <button className="p-2 hover:opacity-100 opacity-40 transition-opacity">
                                <XCircle className="w-5 h-5" />
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className={`w-full md:w-[400px] shrink-0 p-10 rounded-[48px] flex flex-col items-center justify-center text-center space-y-8 border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-cool-gray/5 border-cool-gray/5'
                  }`}>
                     <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-accent flex items-center justify-center">
                           <Layout className="w-12 h-12 text-accent" />
                        </div>
                        <div className="absolute inset-0 border-4 border-accent/20 rounded-full animate-ping" />
                     </div>
                     <div className="space-y-1">
                        <h4 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-navy'}`}>Healthy Node</h4>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Session ID: {Math.random().toString(36).substr(2, 9)}</p>
                     </div>
                     <p className={`text-sm leading-relaxed ${isDark ? 'text-white/40' : 'text-cool-gray'}`}>Your retail instance is currently optimized. Caching ratio at 42%. Overall system latency within 200ms bounds.</p>
                     <button className="w-full py-5 rounded-[28px] bg-navy text-white font-bold text-xs uppercase tracking-widest fashion-shadow shadow-xl">Run Diagnostics</button>
                  </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
