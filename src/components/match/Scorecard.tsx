import React from 'react';
import { ScorecardView } from '@/lib/cricket/innings';

interface ScorecardProps {
  scorecard: ScorecardView;
  battingTeamName: string;
  bowlingTeamName: string;
}

export const ScorecardComponent: React.FC<ScorecardProps> = ({
  scorecard,
  battingTeamName,
  bowlingTeamName,
}) => {
  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
      {/* Batting Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            🏏 Batting — <span className="text-orange-600">{battingTeamName}</span>
          </h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            CRR: {scorecard.runRate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4 rounded-l-xl">Batter</th>
                <th className="py-3 px-4">Dismissal</th>
                <th className="py-3 px-3 text-right">R</th>
                <th className="py-3 px-3 text-right">B</th>
                <th className="py-3 px-3 text-right">4s</th>
                <th className="py-3 px-3 text-right">6s</th>
                <th className="py-3 px-4 text-right rounded-r-xl">S/R</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {scorecard.batting.map((batter) => (
                <tr key={batter.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {batter.name} {batter.isOnStrike ? '*' : ''}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-500">
                    {batter.dismissal}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">{batter.runs}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{batter.balls}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 font-bold">{batter.fours}</td>
                  <td className="py-3 px-3 text-right text-amber-600 font-bold">{batter.sixes}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">{batter.strikeRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras Summary */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 border border-slate-100">
          <div>
            <strong>Extras:</strong> {scorecard.extras.total} (wd {scorecard.extras.wides}, nb {scorecard.extras.noBalls}, b {scorecard.extras.byes}, lb {scorecard.extras.legByes})
          </div>
        </div>
      </div>

      {/* Bowling Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            🎯 Bowling — <span className="text-orange-600">{bowlingTeamName}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4 rounded-l-xl">Bowler</th>
                <th className="py-3 px-3 text-right">O</th>
                <th className="py-3 px-3 text-right">M</th>
                <th className="py-3 px-3 text-right">R</th>
                <th className="py-3 px-3 text-right">W</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Econ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {scorecard.bowling.map((bowler) => (
                <tr key={bowler.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{bowler.name}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{bowler.overs}</td>
                  <td className="py-3 px-3 text-right text-slate-500">{bowler.maidens}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{bowler.runs}</td>
                  <td className="py-3 px-3 text-right font-black text-rose-600">{bowler.wickets}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">{bowler.economy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {scorecard.fallOfWickets.length > 0 && (
        <div>
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">Fall of Wickets</h4>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
            {scorecard.fallOfWickets.map((fow) => (
              <span key={fow.wicketNumber} className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <strong>{fow.runs}-{fow.wicketNumber}</strong> ({fow.playerName}, {fow.overs} ov)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
