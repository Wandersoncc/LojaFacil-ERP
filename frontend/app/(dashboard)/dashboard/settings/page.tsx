"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const router = useRouter();
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Sua conta e preferências"
      />

      <div className="grid gap-6 lg:max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email ?? ""} disabled readOnly />
            </div>
            <p className="text-sm text-muted-foreground">
              A edição de perfil estará disponível em breve.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessão</CardTitle>
            <CardDescription>Encerrar sua sessão neste dispositivo</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
