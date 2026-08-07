import React from 'react';
import Link from 'next/link';
import { MOCK_MATCHES, MOCK_TOURNAMENTS, MOCK_TEAMS, MOCK_PLAYERS, MOCK_SERVICES } from '@/lib/mockData';
import { MatchCard } from '@/components/match/MatchCard';
import { Trophy, Shield, Users, Radio, ArrowRight, Play, Award, Activity, Calendar, Wrench } from 'lucide-react';

export default function HomePage() {
  const liveMatches = MOCK_MATCHES.filter((m) => m.status === 'LIVE');
  const upcomingMatches = MOCK_MATCHES.filter((m) => m.status === 'UPCOMING');
  const recentMatches = MOCK_MATCHES.filter((m) => m.status === 'COMPLETED');

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Local Cricket Operating System
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
              Local Cricket. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">
                Live Scores.
              </span>{' '}
              One Platform.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
              Organize matches, manage tournaments, track player career stats, and follow every ball in real time with our powerful local scoring engine.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/matches"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 fill-slate-950" /> View Live Matches
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-base border border-slate-700 transition-all hover:scale-105"
              >
                <Trophy className="w-5 h-5 text-emerald-400" /> Organize a Tournament
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 text-left">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">120+</div>
                <div className="text-xs font-semibold text-slate-400">Local Clubs</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">1,400+</div>
                <div className="text-xs font-semibold text-slate-400">Live Matches Scored</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">8,500+</div>
                <div className="text-xs font-semibold text-slate-400">Registered Players</div>
              </div>
            </div>
          </div>

          {/* Featured Live Match Preview Card */}
          <div className="lg:col-span-5">
            {liveMatches.length > 0 && (
              <div className="transform hover:-translate-y-1 transition-transform">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Featured Live Match</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Now
                  </span>
                </div>
                <MatchCard match={liveMatches[0]} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live Matches Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Radio className="w-6 h-6 text-rose-500 animate-pulse" /> Live Matches
            </h2>
            <p className="text-sm font-medium text-slate-500">Real-time ball-by-ball updates from ongoing matches</p>
          </div>
          <Link href="/matches" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {/* Upcoming & Recent Matches */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> Upcoming Fixtures
            </h3>
            <Link href="/matches" className="text-xs font-bold text-slate-500 hover:text-emerald-600">
              See Schedule
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Recent Results
            </h3>
            <Link href="/matches" className="text-xs font-bold text-slate-500 hover:text-emerald-600">
              Archive
            </Link>
          </div>
          <div className="space-y-4">
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <Trophy className="w-7 h-7 text-emerald-400" /> Featured Tournaments
              </h2>
              <p className="text-sm text-slate-400">Discover active and upcoming local cricket leagues</p>
            </div>
            <Link
              href="/tournaments"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
            >
              Explore Tournaments
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MOCK_TOURNAMENTS.map((t) => (
              <div key={t.id} className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700/80 hover:border-emerald-500/50 transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {t.format} FORMAT
                  </span>
                  <span className="text-xs font-bold text-slate-400">{t.start_date} to {t.end_date}</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{t.name}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{t.description}</p>
                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>📍 {t.location}</span>
                  <span className="text-emerald-400 font-bold">{t.prize_info}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Performers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" /> Top Performers & Stats Leaderboard
          </h2>
          <p className="text-sm font-medium text-slate-500">Local tournament run scorers and wicket takers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PLAYERS.map((player) => (
            <div key={player.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
                  #{player.jersey_number || '10'}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{player.name}</h4>
                  <span className="text-xs font-semibold text-slate-500">{player.team_name}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-black text-slate-900">{player.runs}</div>
                  <div className="text-slate-400 font-medium">Runs</div>
                </div>
                <div>
                  <div className="font-black text-rose-600">{player.wickets}</div>
                  <div className="text-slate-400 font-medium">Wickets</div>
                </div>
                <div>
                  <div className="font-black text-emerald-600">{player.strike_rate}</div>
                  <div className="text-slate-400 font-medium">S/R</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-7 h-7 text-emerald-600" /> Cricket Services & Ground Booking
            </h2>
            <p className="text-sm font-medium text-slate-500">Book turfs, certified scorers, umpires & match coverage</p>
          </div>
          <Link href="/services" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Browse All Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_SERVICES.map((srv) => (
            <div key={srv.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="h-36 bg-slate-100 overflow-hidden relative">
                <img src={srv.image_url} alt={srv.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-black bg-slate-900/90 text-emerald-400">
                  ₹{srv.price}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{srv.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{srv.description}</p>
                <div className="text-xs font-bold text-emerald-700">📍 {srv.location}</div>
              </div>
              <div className="p-4 pt-0">
                <Link
                  href={`/services/${srv.id}`}
                  className="w-full block text-center py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Book Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black">Ready to Host Your Next Cricket Tournament?</h3>
            <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
              Create teams, schedule matches, assign official scorers, and broadcast live ball-by-ball updates to your spectators.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-base shadow-xl shrink-0 transition-transform hover:scale-105"
          >
            Launch Organizer Console
          </Link>
        </div>
      </section>
    </div>
  );
}
