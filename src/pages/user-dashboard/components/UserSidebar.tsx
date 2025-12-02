import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User,
  FileText,
  LogOut,
  Settings,
  Activity,
  BookOpen,
  FileCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { mastersService } from '@/services/masters.service';
import { peopleService } from '@/services/people.service';

interface UserSidebarProps {
  hasAthlete: boolean;
}

const userMenuItems = [
  {
    path: '/user-dashboard/home',
    icon: Activity,
    label: 'Inicio',
    disabled: false
  },
  {
    path: '/user-dashboard/profile',
    icon: User,
    label: 'Mi Perfil',
    disabled: false
  },
  {
    path: '/user-dashboard/postulations/new/personal-info',
    icon: UserPlus,
    label: 'Registrar Datos',
    disabled: false
  },
  {
    path: '/user-dashboard/postulations',
    icon: FileCheck,
    label: 'Mis Postulaciones',
    disabled: false
  },
  {
    path: '/user-dashboard/sports-history-management',
    icon: BookOpen,
    label: 'Historial Deportivo',
    disabled: false
  },
  {
    path: '/user-dashboard/documents',
    icon: FileText,
    label: 'Mis Documentos',
    disabled: false
  }
];

export const UserSidebar = ({ hasAthlete }: UserSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, athlete } = useAuth();
  const [menuItems, setMenuItems] = useState(userMenuItems);
  const [tokenDocAbbrev, setTokenDocAbbrev] = useState<string>('');
  const [personNames, setPersonNames] = useState<{name: string; lastName: string}>({name: '', lastName: ''});

  // Función para obtener abreviatura de tipo de documento (misma lógica que SportsHistory & UserInfoBanner)
  const getDocumentAbbrev = (docName?: string) => {
    if (!docName) return '';
    const lower = docName.toLowerCase();
    if (lower.includes('tarjeta') && lower.includes('identidad')) return 'TI';
    if ((lower.includes('cédula') || lower.includes('cedula')) && lower.includes('ciudad')) return 'CC';
    return docName;
  };

  useEffect(() => {
    const getDocumentTypeFromToken = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Priorizar nombre del tipo de documento si existe
        const docTypeName: string | undefined = payload.document_type_name || payload.document_type;
        if (docTypeName) {
          setTokenDocAbbrev(getDocumentAbbrev(docTypeName));
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    };

    getDocumentTypeFromToken();
  }, []);

  // Intentar resolver la abreviatura mediante petición al servicio master si sólo se tiene el ID
  useEffect(() => {
    const resolveAbbrevFromId = async () => {
      if (tokenDocAbbrev) return; // ya está resuelto
      // Cuando el usuario recién se ha registrado, document_type suele ser el ID (uuid)
      const docTypeId = typeof user?.document_type === 'string' && user.document_type.length > 8 ? user.document_type : undefined;
      if (!docTypeId) return;

      try {
        const types = await mastersService.getDocumentTypes();
        const found = types.find((t: any) => t.id === docTypeId);
        if (found?.name) {
          setTokenDocAbbrev(getDocumentAbbrev(found.name));
        }
      } catch (err) {
        console.warn('No se pudieron obtener tipos de documento:', err);
      }
    };

    resolveAbbrevFromId();
  }, [user?.document_type, tokenDocAbbrev]);

  // Intentar recuperar nombre y apellido de la entidad Person si aún no están disponibles
  useEffect(() => {
    const fetchPersonNames = async () => {
      if (athlete) return; // ya existe atleta con nombres
      if ((user?.name && user.name.trim()) || (user?.last_name && user.last_name.trim())) return; // ya hay nombres
      if (!user?.document_number) return;

      try {
        const people = await peopleService.getPeople();
        const found = people.find((p: any) => (p as any).document_number === user.document_number);
        if (found) {
          const f: any = found; // cast para acceso flexible
          setPersonNames({
            name: f.name || '',
            lastName: f.lastname || f.last_name || ''
          });
        }
      } catch (err) {
        console.warn('No se pudo obtener persona para nombres:', err);
      }
    };

    fetchPersonNames();
  }, [athlete, user?.name, user?.last_name, user?.document_number]);

  useEffect(() => {
    /*
      Cuando el atleta ya está registrado (`hasAthlete === true`) eliminamos del menú la opción
      "Registrar Datos" y habilitamos el resto de opciones. Si todavía no existe atleta,
      mostramos la opción y bloqueamos el resto para guiar al usuario.
    */
    const filteredItems = userMenuItems
      .filter(item => !(item.label === 'Registrar Datos' && hasAthlete))
      .map(item => {
        // El resto de elementos sólo se deshabilitan si aún no se ha registrado el atleta
        const shouldDisable = item.label === 'Registrar Datos' ? false : !hasAthlete;
        return { ...item, disabled: shouldDisable };
    });

    setMenuItems(filteredItems);
  }, [hasAthlete]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string, disabled: boolean, label: string) => {
    if (disabled) {
      if (!hasAthlete) {
        toast.error('Debes registrar tus datos personales primero');
      }
      return;
    }
    navigate(path);
  };

  // Obtener la inicial a mostrar en el avatar
  const getAvatarInitial = () => {
    const sources = [
      athlete?.name,
      personNames.name,
      user?.name,
      athlete?.last_name,
      personNames.lastName,
      user?.last_name
    ];
    for (const src of sources) {
      if (src && src.trim()) return src.trim()[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="bg-[#006837] text-white h-screen w-64 fixed left-0 top-0 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">TRACKSPORT</h1>
      </div>
      
      <nav className="flex-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path, item.disabled, item.label)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
              location.pathname === item.path
                ? 'bg-white/20'
                : item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-white/10'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded">
                Bloqueado
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center gap-3 p-3">
          {/* Avatar con degradado y estado en línea */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006837] to-[#00a65a] flex items-center justify-center text-white font-bold">
              {getAvatarInitial()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          {/* Nombre y documento */}
          <div>
            <p className="font-medium leading-none">
              {(() => {
                if (athlete && (athlete.name || athlete.last_name)) {
                  return `${athlete.name} ${athlete.last_name}`.trim();
                }
                if (user && ((user.name && user.name.trim()) || (user.last_name && user.last_name.trim()))) {
                  return `${user.name || ''} ${user.last_name || ''}`.trim();
                }
                if (personNames.name || personNames.lastName) {
                  return `${personNames.name} ${personNames.lastName}`.trim();
                }
                return 'Usuario';
              })()}
            </p>
            <div className="flex items-center gap-1 text-xs text-white/70 mt-0.5">
              <FileText size={14} />
              <span>
                {(() => {
                  const docAbbrev = getDocumentAbbrev((athlete as any)?.document_type?.name) || tokenDocAbbrev;
                  const docNumber = athlete?.document_number || user?.document_number;
                  if (docNumber) return docAbbrev ? `${docAbbrev} ${docNumber}` : docNumber;
                  return 'Documento no disponible';
                })()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}; 