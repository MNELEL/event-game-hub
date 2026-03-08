import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { open: boolean; onClose: () => void };

export function TutorialDialog({ open, onClose }: Props) {
  const steps = [
    { emoji: "1️⃣", title: "צרו את המשחק", desc: "הוסיפו שאלות משלכם או השתמשו בשאלות המוכנות. בחרו קטגוריות והגדירו את המשחק." },
    { emoji: "2️⃣", title: "הציבו את המסך", desc: "חברו את המחשב למסך גדול או מקרן. המשתתפים צריכים לראות את המסך." },
    { emoji: "3️⃣", title: "המשתתפים מצטרפים", desc: "על המסך יופיע קישור ומספר טלפון. המשתתפים נכנסים מהטלפון שלהם." },
    { emoji: "4️⃣", title: "התחילו לשחק!", desc: "לחצו על 'התחל משחק' והשאלות יופיעו על המסך. כל משתתף עונה מהטלפון." },
    { emoji: "🏆", title: "תוצאות ודירוג", desc: "אחרי כל שאלה מופיעות התוצאות וטבלת הדירוג. בסוף מוכרז המנצח!" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">איך משחקים? 🎮</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className="text-2xl">{step.emoji}</span>
              <div>
                <h3 className="font-display font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
