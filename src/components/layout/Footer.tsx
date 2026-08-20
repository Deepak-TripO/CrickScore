import React from 'react';
import Link from 'next/link';
import Logo from '@/components/common/Logo';
import { MapPin, Phone, Mail, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Logo size="md" href="/" />
            <p className="text-sm leading-relaxed text-slate-400">
              The premier platform for local cricket match organization, tournament management, and real-time ball-by-ball live score updates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Navigation</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/matches" className="hover:text-orange-400 transition-colors">
                  Live Matches
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-orange-400 transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-orange-400 transition-colors">
                  Teams & Clubs
                </Link>
              </li>
              <li>
                <Link href="/master/dashboard" className="hover:text-orange-400 transition-colors">
                  Master Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles & Dashboards */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Platform Roles</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/apply-master" className="hover:text-orange-400 transition-colors">
                  Master Applications
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-orange-400 transition-colors">
                  Register Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-orange-400 transition-colors">
                  Team Manager Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Contact Us</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Bangalore Sports Hub, Karnataka</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-400 shrink-0" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-400 shrink-0" />
              <span>support@batscore.local</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} BatScore. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> for grassroots cricket lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};
