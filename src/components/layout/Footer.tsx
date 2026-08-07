import React from 'react';
import Link from 'next/link';
import { Trophy, Shield, Phone, Mail, MapPin, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg">
                ⚡
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Crick<span className="text-emerald-400">Score</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              The premier platform for local cricket match organization, tournament management, and real-time ball-by-ball live score updates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Navigation</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/matches" className="hover:text-emerald-400 transition-colors">
                  Live Matches
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-emerald-400 transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="/teams" className="hover:text-emerald-400 transition-colors">
                  Teams & Clubs
                </Link>
              </li>
              <li>
                <Link href="/players" className="hover:text-emerald-400 transition-colors">
                  Player Statistics
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-emerald-400 transition-colors">
                  Cricket Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles & Dashboards */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Platform Roles</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Organizer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Scorer & Player Portal
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-emerald-400 transition-colors">
                  Register Tournament
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Team Manager Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3 text-sm">
            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Contact Us</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bangalore Sports Hub, Karnataka</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>support@crickscore.local</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CrickScore. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for grassroots cricket lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};
