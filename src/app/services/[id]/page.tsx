import React from 'react';
import { MOCK_SERVICES } from '@/lib/mockData';
import { Wrench, MapPin, Phone, CheckCircle, Calendar } from 'lucide-react';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const service = MOCK_SERVICES.find((s) => s.id === params.id) || MOCK_SERVICES[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
        <div className="h-64 sm:h-80 bg-slate-900 relative">
          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950">
              {service.availability}
            </span>
            <h1 className="text-3xl font-black">{service.name}</h1>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Pricing</div>
              <div className="text-3xl font-black text-emerald-600">₹{service.price}</div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Provider</div>
              <div className="text-base font-extrabold text-slate-900">{service.provider_name}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-lg">Service Details</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{service.description}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-emerald-600" /> Location: {service.location}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Phone className="w-4 h-4 text-emerald-600" /> Contact Provider: {service.provider_contact}
            </div>
          </div>

          <button className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 transition-all">
            Book Service Now
          </button>
        </div>
      </div>
    </div>
  );
}
