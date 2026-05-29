'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface QueryResult {
  sqlQuery: string;
  results: any[];
  error?: string;
}

interface TableSchema {
  name: string;
  fields: { name: string; type: string }[];
}

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [executionTime, setExecutionTime] = useState<number>(0);

  const API_BASE_URL = 'http://localhost:8080/api';

  // Fetch database schema on mount
  useEffect(() => {
    fetchSchema();
  }, []);

  // Fetch database schema
  const fetchSchema = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/schema`);
      setSchema(response.data.schema);
    } catch (error: any) {
      console.error('Error fetching schema:', error);
      setError('Failed to connect to database. Ensure backend is running.');
    }
  };

  // Parse schema into structured format
  const parseSchema = (schemaText: string): TableSchema[] => {
    const tables: TableSchema[] = [];
    const lines = schemaText.split('\n');
    let currentTable: TableSchema | null = null;

    lines.forEach(line => {
      if (line.includes('Table:')) {
        if (currentTable) tables.push(currentTable);
        const tableName = line.replace('Table:', '').trim();
        currentTable = { name: tableName, fields: [] };
      } else if (line.includes('-') && currentTable) {
        // Updated regex to handle field names with spaces and complex types
        const match = line.match(/- (.+?) \((.+?)\)/);
        if (match) {
          currentTable.fields.push({ name: match[1], type: match[2] });
        }
      }
    });
    if (currentTable) tables.push(currentTable);
    return tables;
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };

  // Handle sending a question
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError('');
    setSqlQuery('');
    setResults([]);
    
    const startTime = performance.now();

    try {
      // Call the /query endpoint to generate and execute SQL
      const response = await axios.post(`${API_BASE_URL}/query`, {
        question: input
      });

      setSqlQuery(response.data.sqlQuery);
      setResults(response.data.results || []);
      
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));

    } catch (error: any) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate sparkline data for numeric values
  const generateSparkline = (value: any, rowIndex: number) => {
    const points = 8;
    const baseValue = typeof value === 'number' ? value : 1000;
    const variation = baseValue * 0.15;
    return Array.from({ length: points }, (_, i) => {
      const randomFactor = Math.sin(rowIndex + i) * 0.5 + 0.5;
      return baseValue + (randomFactor * variation) - (variation / 2);
    });
  };

  // Render mini sparkline chart
  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke="#f97316"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Top Bar */}
      <div className="border-b border-orange-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-[2000px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">
              SQL <span className="text-orange-600">GenPro</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${schema ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {schema ? '● Connected' : '○ Disconnected'}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                A
              </div>
              <span className="text-sm text-gray-700">Alex R.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-[2000px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-5 h-[calc(100vh-100px)]">
          
          {/* Left Panel - Schema Tree */}
          <div className="col-span-3 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Data Schemas</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
                  </svg>
                </button>
              </div>
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="eCommerce_DB"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    disabled
                  />
                  <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent p-2">
                {schema ? (
                  <div className="space-y-1">
                    {parseSchema(schema).map((table, tableIdx) => (
                      <div key={table.name} className={`rounded-lg overflow-hidden ${tableIdx === 0 ? 'bg-orange-50/50' : ''}`}>
                        <button
                          onClick={() => toggleTable(table.name)}
                          className={`w-full px-3 py-2 flex items-center space-x-2 transition-colors ${
                            tableIdx === 0 
                              ? 'hover:bg-orange-100/50 rounded-t-lg' 
                              : 'hover:bg-gray-50 rounded-lg'
                          }`}
                        >
                          <svg className={`w-4 h-4 text-gray-600 transition-transform ${expandedTables.has(table.name) ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                          </svg>
                          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-sm font-medium text-gray-800">{table.name}</span>
                        </button>
                        {expandedTables.has(table.name) && (
                          <div className="px-3 pb-2 space-y-1">
                            {table.fields.map((field, idx) => (
                              <div key={idx} className="pl-6 py-1.5 flex items-center justify-between text-xs hover:bg-orange-100/30 rounded">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-3.5 h-3.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                                  </svg>
                                  <span className="text-gray-800">{field.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-orange-600 font-medium">{field.type}</span>
                                  {(field.name.toUpperCase().includes('ID') || field.name.toUpperCase() === 'ID') && (
                                    <svg className="w-3.5 h-3.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📊</div>
                      <p>Loading schema...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Panel - Input & Prompt */}
          <div className="col-span-4 flex flex-col space-y-4">
            {/* Input Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Natural Language Input</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Find total revenue and orders for 'Processing' status in 2023, by month."
                  className="w-full bg-orange-50/50 border border-orange-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none text-sm leading-relaxed"
                  rows={5}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a 1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>{loading ? 'Processing...' : 'GENERATE SQL'}</span>
                </button>
              </form>

              {error && (
                <div className="mx-5 mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Data Items Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700">Data items</h2>
              </div>
              <div className="overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50 sticky top-0">
                    <tr className="border-b border-orange-200">
                      <th className="px-5 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-700">Data Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schema ? (
                      parseSchema(schema).flatMap(table => 
                        table.fields.map((field, idx) => (
                          <tr key={`${table.name}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-5 py-3 text-gray-800 flex items-center space-x-2">
                              {field.name === 'ID' || field.name === 'Customer_ID' ? (
                                <svg className="w-3.5 h-3.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                                </svg>
                              ) : null}
                              <span>{field.name}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                {field.type}
                              </span>
                            </td>
                          </tr>
                        ))
                      )
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-5 py-10 text-center text-gray-400">
                          No schema data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel - SQL & Results */}
          <div className="col-span-5 flex flex-col space-y-4">
            {/* SQL Output */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">SQL Output</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                    </svg>
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="bg-orange-50/30 p-5 min-h-[240px] font-mono text-sm">
                {sqlQuery ? (
                  <div className="space-y-1">
                    {sqlQuery.split(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|AND|OR|COUNT|SUM|AS)\b/gi).map((part, idx) => {
                      const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'AND', 'OR', 'AS'];
                      const functions = ['COUNT', 'SUM', 'DATE_FORMAT', 'YEAR'];
                      
                      if (keywords.includes(part.toUpperCase())) {
                        return <span key={idx} className="text-orange-700 font-semibold">{part}</span>;
                      } else if (functions.includes(part.toUpperCase())) {
                        return <span key={idx} className="text-blue-600 font-semibold">{part}</span>;
                      }
                      return <span key={idx} className="text-gray-800">{part}</span>;
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm flex items-center justify-center h-[200px]">
                    SQL query will appear here...
                  </div>
                )}
              </div>
              {sqlQuery && (
                <div className="px-5 py-3 border-t border-gray-200 flex items-center space-x-3">
                  <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                    </svg>
                    <span>Run Query</span>
                  </button>
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              )}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Query Results</h2>
                {results.length > 0 && (
                  <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center space-x-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>Query executed successfully in {executionTime}ms</span>
                  </div>
                )}
              </div>
              {results.length > 0 && (
                <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filters"
                      className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    />
                    <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"/>
                      </svg>
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {results.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-orange-50 sticky top-0 border-b border-orange-200">
                      <tr>
                        {Object.keys(results[0]).map((key, idx) => (
                          <th
                            key={key}
                            className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                          >
                            <div className="flex items-center space-x-2">
                              <span>{key}</span>
                              {idx > 0 && (
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"/>
                                </svg>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row: any, rowIndex: number) => (
                        <tr
                          key={rowIndex}
                          className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors"
                        >
                          {Object.entries(row).map(([key, value]: [string, any], colIndex: number) => (
                            <td
                              key={colIndex}
                              className="px-5 py-3 text-gray-800 whitespace-nowrap"
                            >
                              {value !== null ? (
                                <span className={colIndex === 0 ? 'font-medium' : ''}>
                                  {typeof value === 'number' && colIndex > 0 
                                    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : String(value)
                                  }
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">null</span>
                              )}
                            </td>
                          ))}
                          <td className="px-5 py-3">
                            {renderSparkline(generateSparkline(Object.values(row)[1], rowIndex))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-gray-400 text-sm flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-3">�</div>
                      <p>Results will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
