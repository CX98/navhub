import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
}

export function LoginDialog({ open, onClose, onLogin }: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await onLogin(username.trim(), password.trim());
      setUsername("");
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-dialog-content max-w-sm rounded-2xl border-white/60 p-0 overflow-hidden">
        {/* Header banner */}
        <div className="relative h-20 bg-gradient-to-r from-indigo-500 to-purple-500">
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <KeyRound className="size-8 text-white/90" />
            <h2 className="text-xl font-bold text-white">登录 NavHub</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <DialogHeader className="sr-only">
            <DialogTitle>登录</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">用户名</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                className="glass-input rounded-xl border-white/40 text-gray-800 placeholder:text-gray-400"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">密码</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                type="password"
                className="glass-input rounded-xl border-white/40 text-gray-800 placeholder:text-gray-400"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:from-indigo-600 hover:to-purple-600"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {submitting ? "登录中..." : "登录"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400">
            按 Ctrl+Shift+K 可随时打开登录窗口
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
