import React from 'react';
import Link from 'next/link';
import { MOCK_SERVICES } from '@/lib/mockData';
import { Wrench, MapPin, Phone, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-emerald-600" /> Cricket Services Marketplace
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Book floodlit turf grounds, hire certified digital live scorers, official umpires & drone stream coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_SERVICES.map((srv) => (
          <div key={srv.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="h-44 bg-slate-100 overflow-hidden relative">
                <img src={srv.image_url} alt={srv.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-emerald-400 shadow-md">
                  ₹{srv.price}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-base">{srv.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {srv.location}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                href={`/services/${srv.id}`}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                Request Service <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
