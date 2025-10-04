import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { Menu, MapIcon, Search, Globe } from "lucide-react";

interface MobileNavigationProps {
  searchMode: 'map' | 'name' | 'coordinates';
  onSearchModeChange: (mode: 'map' | 'name' | 'coordinates') => void;
}

export function MobileNavigation({ searchMode, onSearchModeChange }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleModeSelect = (mode: 'map' | 'name' | 'coordinates') => {
    onSearchModeChange(mode);
    setIsOpen(false);
  };

  const modes = [
    {
      id: 'map' as const,
      title: 'Mapa Interativo',
      description: 'Clique no mapa para selecionar',
      icon: MapIcon,
    },
    {
      id: 'name' as const,
      title: 'Por Nome',
      description: 'Busque por cidade ou endereço',
      icon: Search,
    },
    {
      id: 'coordinates' as const,
      title: 'Coordenadas',
      description: 'Digite latitude e longitude',
      icon: Globe,
    },
  ];

  const currentMode = modes.find(mode => mode.id === searchMode);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="w-full flex items-center justify-between p-4 h-auto border-2"
        >
          <div className="flex items-center space-x-3">
            {currentMode && <currentMode.icon className="h-5 w-5 text-blue-600" />}
            <div className="text-left">
              <div className="font-semibold">{currentMode?.title}</div>
              <div className="text-sm text-muted-foreground">{currentMode?.description}</div>
            </div>
          </div>
          <Menu className="h-5 w-5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader className="text-left mb-6">
          <SheetTitle>Escolha o método de seleção</SheetTitle>
          <SheetDescription>
            Como você deseja selecionar a localização?
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-3">
          {modes.map((mode) => (
            <Button
              key={mode.id}
              variant={searchMode === mode.id ? "default" : "outline"}
              size="lg"
              className="w-full flex items-center justify-start space-x-3 p-4 h-auto"
              onClick={() => handleModeSelect(mode.id)}
            >
              <mode.icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{mode.title}</div>
                <div className="text-sm opacity-80">{mode.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
