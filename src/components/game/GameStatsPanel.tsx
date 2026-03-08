import { useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Player, Question } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ArrowRight, Target, Zap, Trophy, PieChart as PieIcon, Download, Image } from "lucide-react";
import { SoundEffects } from "@/hooks/useSoundEffects";
import html2canvas from "html2canvas";

type Props = {
  players: Player[];
  questions: Question[];
  onClose: () => void;
};

const CHART_COLORS = [
  "hsl(45, 90%, 50%)",
  "hsl(250, 70%, 55%)",
  "hsl(170, 70%, 45%)",
  "hsl(330, 70%, 55%)",
  "hsl(200, 80%, 50%)",
  "hsl(15, 85%, 55%)",
  "hsl(145, 65%, 42%)",
  "hsl(290, 60%, 55%)",
];

export function GameStatsPanel({ players, questions, onClose }: Props) {
  const correctAnswersData = useMemo(() => {
    return players.map((p, i) => ({
      name: p.name,
      correct: p.answers.filter(a => a.correct).length,
      wrong: p.answers.filter(a => !a.correct).length,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })).sort((a, b) => b.correct - a.correct);
  }, [players]);

  const fastestPlayersData = useMemo(() => {
    return players
      .filter(p => p.answers.length > 0)
      .map((p, i) => {
        const avgTime = p.answers.reduce((sum, a) => sum + a.time, 0) / p.answers.length;
        return {
          name: p.name,
          avgTime: Math.round(avgTime * 10) / 10,
          fill: CHART_COLORS[i % CHART_COLORS.length],
        };
      })
      .sort((a, b) => a.avgTime - b.avgTime);
  }, [players]);

  const answerDistribution = useMemo(() => {
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnanswered = 0;

    players.forEach(p => {
      totalCorrect += p.answers.filter(a => a.correct).length;
      totalWrong += p.answers.filter(a => !a.correct).length;
      totalUnanswered += Math.max(0, questions.length - p.answers.length);
    });

    return [
      { name: "נכונות", value: totalCorrect, fill: "hsl(145, 65%, 42%)" },
      { name: "שגויות", value: totalWrong, fill: "hsl(0, 70%, 55%)" },
      { name: "לא נענו", value: totalUnanswered, fill: "hsl(40, 30%, 60%)" },
    ].filter(d => d.value > 0);
  }, [players, questions]);

  const scoreProgressData = useMemo(() => {
    return players.map((p, i) => {
      let cumulative = 0;
      const correctCount = p.answers.filter(a => a.correct).length;
      const avgTime = p.answers.length > 0
        ? Math.round((p.answers.reduce((s, a) => s + a.time, 0) / p.answers.length) * 10) / 10
        : 0;
      return {
        name: p.name,
        score: p.score,
        correct: correctCount,
        accuracy: p.answers.length > 0 ? Math.round((correctCount / p.answers.length) * 100) : 0,
        avgTime,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      };
    }).sort((a, b) => b.score - a.score);
  }, [players]);

  const customTooltipStyle = {
    backgroundColor: "hsl(35, 40%, 92%)",
    border: "2px solid hsl(35, 50%, 70%)",
    borderRadius: "12px",
    padding: "8px 12px",
    fontFamily: "serif",
    color: "hsl(35, 60%, 25%)",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-6">
      <motion.div
        className="w-full max-w-5xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150 }}
      >
        <div className="text-center mb-6">
          <h1 className="font-serif text-4xl md:text-5xl text-game-dark-gold text-shadow-game mb-2">
            📊 סטטיסטיקות המשחק
          </h1>
          <div className="w-32 mx-auto border-t-2 border-double border-game-border-gold my-3" />
        </div>

        <Tabs defaultValue="correct" className="w-full" dir="rtl">
          <TabsList className="w-full flex flex-wrap gap-1 bg-game-cream/50 border border-game-border-gold rounded-xl p-1 mb-4">
            <TabsTrigger value="correct" className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-game-gold/20 data-[state=active]:text-game-dark-gold font-serif">
              <Target className="w-4 h-4" />
              תשובות נכונות
            </TabsTrigger>
            <TabsTrigger value="fastest" className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-game-gold/20 data-[state=active]:text-game-dark-gold font-serif">
              <Zap className="w-4 h-4" />
              מהירות
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-game-gold/20 data-[state=active]:text-game-dark-gold font-serif">
              <PieIcon className="w-4 h-4" />
              התפלגות
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex-1 min-w-[100px] gap-1.5 data-[state=active]:bg-game-gold/20 data-[state=active]:text-game-dark-gold font-serif">
              <Trophy className="w-4 h-4" />
              סקירה כללית
            </TabsTrigger>
          </TabsList>

          {/* Correct Answers Chart */}
          <TabsContent value="correct">
            <motion.div
              className="parchment-card rounded-2xl p-4 md:p-6 parchment-border-double"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="font-serif text-2xl text-game-dark-gold mb-4 text-center">🎯 תשובות נכונות vs שגויות</h3>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={correctAnswersData} layout="vertical" margin={{ right: 20, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 30%, 80%)" />
                    <XAxis type="number" tick={{ fontFamily: "serif", fill: "hsl(35, 60%, 30%)" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontFamily: "serif", fill: "hsl(35, 60%, 30%)", fontSize: 14 }} width={80} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="correct" name="נכונות" fill="hsl(145, 65%, 42%)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="wrong" name="שגויות" fill="hsl(0, 60%, 55%)" radius={[0, 6, 6, 0]} />
                    <Legend wrapperStyle={{ fontFamily: "serif" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </TabsContent>

          {/* Fastest Players Chart */}
          <TabsContent value="fastest">
            <motion.div
              className="parchment-card rounded-2xl p-4 md:p-6 parchment-border-double"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="font-serif text-2xl text-game-dark-gold mb-4 text-center">⚡ זמן תגובה ממוצע (שניות)</h3>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fastestPlayersData} margin={{ right: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 30%, 80%)" />
                    <XAxis dataKey="name" tick={{ fontFamily: "serif", fill: "hsl(35, 60%, 30%)" }} />
                    <YAxis tick={{ fontFamily: "serif", fill: "hsl(35, 60%, 30%)" }} />
                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: number) => [`${value} שניות`, "זמן ממוצע"]} />
                    <Bar dataKey="avgTime" name="זמן ממוצע">
                      {fastestPlayersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </TabsContent>

          {/* Distribution Pie Chart */}
          <TabsContent value="distribution">
            <motion.div
              className="parchment-card rounded-2xl p-4 md:p-6 parchment-border-double"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="font-serif text-2xl text-game-dark-gold mb-4 text-center">📊 התפלגות תשובות כללית</h3>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={answerDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: "hsl(35, 50%, 60%)" }}
                    >
                      {answerDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(35, 40%, 85%)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Legend wrapperStyle={{ fontFamily: "serif" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </TabsContent>

          {/* Overview Table */}
          <TabsContent value="overview">
            <motion.div
              className="parchment-card rounded-2xl p-4 md:p-6 parchment-border-double"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="font-serif text-2xl text-game-dark-gold mb-4 text-center">🏆 סקירה כללית</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b-2 border-game-border-gold">
                      <th className="font-serif text-game-dark-gold p-3">דירוג</th>
                      <th className="font-serif text-game-dark-gold p-3">שם</th>
                      <th className="font-serif text-game-dark-gold p-3">ניקוד</th>
                      <th className="font-serif text-game-dark-gold p-3">נכונות</th>
                      <th className="font-serif text-game-dark-gold p-3">דיוק</th>
                      <th className="font-serif text-game-dark-gold p-3">זמן ממוצע</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreProgressData.map((p, i) => (
                      <motion.tr
                        key={p.name}
                        className="border-b border-game-border-gold/30 hover:bg-game-gold/5"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <td className="p-3 font-serif text-lg">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                        </td>
                        <td className="p-3 font-serif text-game-dark-gold font-bold">{p.name}</td>
                        <td className="p-3 font-serif text-game-gold font-bold">{p.score}</td>
                        <td className="p-3 font-serif">{p.correct}/{questions.length}</td>
                        <td className="p-3 font-serif">
                          <span className={`px-2 py-0.5 rounded-full text-sm ${
                            p.accuracy >= 70 ? "bg-green-100 text-green-700" :
                            p.accuracy >= 40 ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {p.accuracy}%
                          </span>
                        </td>
                        <td className="p-3 font-serif">{p.avgTime} שנ׳</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="gold"
              size="xl"
              onClick={() => { SoundEffects.click(); onClose(); }}
              className="gap-3"
            >
              <ArrowRight className="w-5 h-5" />
              חזרה לתוצאות
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
