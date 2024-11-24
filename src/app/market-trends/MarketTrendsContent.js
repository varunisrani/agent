"use client";

import { useState, useEffect } from 'react';
import { socket, safeEmit, checkConnection } from '@/config/socket';
import { useStoredInput } from '@/hooks/useStoredInput';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MarketTrendsContent() {
  const [userInput, setUserInput] = useStoredInput();
  const [marketAnalysis, setMarketAnalysis] = useState('');
  const [marketData, setMarketData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [lastAnalyzedInput, setLastAnalyzedInput] = useState('');

  // Chart options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Market Growth Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Growth Rate (%)',
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Market Segment Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Market Share (%)',
        },
      },
    },
  };

  // Parse market data from GROQ response
  const parseMarketData = (content) => {
    try {
      // Extract growth rates and market segments from the analysis text
      const growthRateMatch = content.match(/growth rate[s]?\s*(?:of|:)?\s*(\d+(?:\.\d+)?)/i);
      const segmentMatches = content.match(/(\w+)\s*segment[s]?\s*(?::|accounts for|represents)?\s*(\d+(?:\.\d+)?)\s*%/gi);

      const monthlyGrowth = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Market Growth (%)',
          data: Array(12).fill().map(() => 
            parseFloat(growthRateMatch?.[1] || 0) + (Math.random() * 2 - 1)
          ),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.4,
        }],
      };

      const segments = segmentMatches ? segmentMatches.map(match => {
        const [segment, percentage] = match.match(/(\w+)\s*segment[s]?\s*(?::|accounts for|represents)?\s*(\d+(?:\.\d+)?)/i).slice(1);
        return { segment, percentage: parseFloat(percentage) };
      }) : [
        { segment: 'Enterprise', percentage: 35 },
        { segment: 'SMB', percentage: 25 },
        { segment: 'Consumer', percentage: 20 },
        { segment: 'Government', percentage: 12 },
        { segment: 'Education', percentage: 8 },
      ];

      const marketSegments = {
        labels: segments.map(s => s.segment),
        datasets: [{
          label: 'Market Share (%)',
          data: segments.map(s => s.percentage),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        }],
      };

      return { monthlyGrowth, marketSegments };
    } catch (error) {
      console.error('Error parsing market data:', error);
      return null;
    }
  };

  // Load stored analysis and data
  useEffect(() => {
    setMounted(true);
    const storedAnalysis = localStorage.getItem(`marketAnalysis_${userInput}`);
    
    if (storedAnalysis) {
      setMarketAnalysis(storedAnalysis);
      setMarketData(parseMarketData(storedAnalysis));
      setLastAnalyzedInput(userInput);
    } else {
      setMarketAnalysis('');
      setMarketData(null);
      if (isConnected && mounted && userInput && !isLoading && userInput !== lastAnalyzedInput) {
        handleSubmit(new Event('submit'));
        setLastAnalyzedInput(userInput);
      }
    }
  }, [userInput, isConnected, mounted]);

  // Socket connection handling
  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    const handleReceiveMessage = (data) => {
      console.log('Received message:', data);
      setIsLoading(false);
      
      if (data.type === 'error') {
        setError(data.content);
        return;
      }

      if (data.analysisType === 'market') {
        const analysisResult = data.content;
        setMarketAnalysis(analysisResult);
        setMarketData(parseMarketData(analysisResult));
        localStorage.setItem(`marketAnalysis_${userInput}`, analysisResult);
        setLastAnalyzedInput(userInput);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Connection error. Retrying...');
    });

    setIsConnected(checkConnection());

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('connect_error');
    };
  }, [userInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // Check if analysis already exists for this exact input
    const storedAnalysis = localStorage.getItem(`marketAnalysis_${userInput}`);
    if (storedAnalysis && userInput === lastAnalyzedInput) {
      setMarketAnalysis(storedAnalysis);
      return; // Don't proceed with API call if we have stored results for this input
    }

    setIsLoading(true);
    setError(null);

    try {
      await safeEmit('send_message', {
        message: `Perform a detailed market analysis for this startup/business: ${userInput}. 
        Please analyze:
        1. Market Trends
           - Current market dynamics
           - Emerging trends
           - Consumer behavior patterns
           - Industry-specific developments
        2. Market Size
           - Total addressable market
           - Market growth rate
           - Market segments
           - Geographic distribution
        3. Target Audience
           - Customer demographics
           - Customer needs and preferences
           - Market penetration opportunities
           - Customer acquisition channels
        4. Competitive Landscape
           - Key competitors
           - Market positioning
           - Competitive advantages
           - Market share distribution`,
        agent: 'MarketInsightCEO',
        analysisType: 'market'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send analysis request. Please try again.');
      setIsLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Market Trends Analysis
          </h1>
          <div className="text-sm text-gray-500">
            {isConnected ? 
              <span className="text-green-500">●</span> : 
              <span className="text-red-500">●</span>
            } {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </header>

        {/* Market Visualization Section */}
        {marketData && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Growth Trend Chart */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="h-[400px]">
                <Line options={lineOptions} data={marketData.monthlyGrowth} />
              </div>
            </div>

            {/* Market Segments Chart */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="h-[400px]">
                <Bar options={barOptions} data={marketData.marketSegments} />
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="mb-4">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your business details for market analysis..."
                className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none text-black"
                disabled={!isConnected || isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!isConnected || isLoading}
              className={`w-full p-4 rounded-lg font-medium transition-colors ${
                isConnected && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Market'}
            </button>
          </form>
        </div>

        {/* Analysis Results */}
        <div className="grid md:grid-cols-1 gap-6">
          {/* Market Analysis Box */}
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 flex items-center">
              <span className="mr-2">📊</span> Market Analysis
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
              {error ? (
                <div className="text-red-500">
                  {error}
                  <p className="text-sm mt-2">Please try refreshing the page or contact support if the problem persists.</p>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : marketAnalysis ? (
                <div className="prose text-black whitespace-pre-wrap">{marketAnalysis}</div>
              ) : (
                <div className="text-gray-500 italic">
                  Market analysis results will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}