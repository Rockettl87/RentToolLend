import React from 'react'
import { Link } from 'react-router-dom'
import { FiTool } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <FiTool className="w-6 h-6 text-brand-400" />
              RentToolLend
            </div>
            <p className="text-sm text-gray-400">Community-powered tool sharing. Rent what you need, earn from what you own.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Renters</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="hover:text-white transition-colors">Find Tools</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/bookings" className="hover:text-white transition-colors">My Bookings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Lenders</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/list-tool" className="hover:text-white transition-colors">List a Tool</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Lender Dashboard</Link></li>
              <li><Link to="/claims" className="hover:text-white transition-colors">Insurance Claims</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Protection</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">✓ Insurance Protection</li>
              <li className="text-gray-400">✓ Secure Payments</li>
              <li className="text-gray-400">✓ Verified Reviews</li>
              <li className="text-gray-400">✓ 24/7 Support</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} RentToolLend. All rights reserved.</p>
          <p className="mt-2 md:mt-0">A 20% platform fee applies to all transactions.</p>
        </div>
      </div>
    </footer>
  )
}
