import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Trash2, Search } from 'lucide-react';

// Lista predefinida de deportes
const SPORTS_LIST = [
  'Fútbol', 'Baloncesto', 'Voleibol', 'Tenis', 'Natación', 'Atletismo',
  'Ciclismo', 'Gimnasia', 'Boxeo', 'Judo', 'Karate', 'Taekwondo',
  'Esgrima', 'Hockey', 'Rugby', 'Béisbol', 'Softball', 'Golf',
  'Bádminton', 'Squash', 'Tenis de Mesa', 'Ajedrez', 'Patinaje',
  'Levantamiento de Pesas', 'Lucha', 'Arquería', 'Tiro Deportivo'
];

interface SportHistory {
  id: string;
  sport: string;
  yearsOfExperience: number;
  certificates: Certificate[];
}

interface Certificate {
  id: string;
  eventName: string;
  eventType: string;
  certificateFile: File | null;
}

// Mapeo de tipos de eventos para mejor visualización
const EVENT_TYPE_LABELS: { [key: string]: string } = {
  'intercolegiados_municipal': 'Juegos Intercolegiados - Fase Municipal',
  'intercolegiados_departamental': 'Juegos Intercolegiados - Fase Departamental',
  'intercolegiados_nacional': 'Juegos Intercolegiados - Fase Nacional',
  'intercolegiados_internacional': 'Juegos Intercolegiados - Fase Internacional',
  'asociado_interclubes': 'Deporte Asociado - Interclubes',
  'asociado_departamental': 'Deporte Asociado - Campeonatos Departamentales',
  'asociado_interligas': 'Deporte Asociado - Interligas',
  'asociado_regional': 'Deporte Asociado - Campeonatos Regionales',
  'asociado_nacional': 'Deporte Asociado - Campeonato Nacional',
  'federado_seleccion': 'Deporte Federado - Selección Nacional',
  'federado_internacional': 'Deporte Federado - Participaciones Internacionales',
  'federado_merito': 'Deporte Federado - Reconocimiento al Mérito Deportivo'
};

export const SportsHistoryPage = () => {
  const navigate = useNavigate();
  const [sportsHistory, setSportsHistory] = useState<SportHistory[]>([]);
  const [currentSport, setCurrentSport] = useState({
    sport: '',
    yearsOfExperience: 0,
  });
  const [currentCertificate, setCurrentCertificate] = useState<Certificate>({
    id: '',
    eventName: '',
    eventType: '',
    certificateFile: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSports, setFilteredSports] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtrar deportes según el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSports([]);
      return;
    }

    const filtered = SPORTS_LIST.filter(sport =>
      sport.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSports(filtered);
  }, [searchTerm]);

  const handleAddSport = () => {
    if (currentSport.sport && currentSport.yearsOfExperience > 0) {
      // Verificar si el deporte ya existe
      const sportExists = sportsHistory.some(
        sport => sport.sport.toLowerCase() === currentSport.sport.toLowerCase()
      );

      if (sportExists) {
        alert('Este deporte ya ha sido agregado');
        return;
      }

      setSportsHistory([
        ...sportsHistory,
        {
          id: Date.now().toString(),
          ...currentSport,
          certificates: [],
        },
      ]);
      setCurrentSport({ sport: '', yearsOfExperience: 0 });
      setSearchTerm('');
      setFilteredSports([]);
    }
  };

  const handleSportSelect = (sport: string) => {
    setCurrentSport({ ...currentSport, sport });
    setSearchTerm(sport);
    setShowSuggestions(false);
  };

  const handleAddCertificate = (sportId: string) => {
    if (currentCertificate.eventName && currentCertificate.eventType && currentCertificate.certificateFile) {
      setSportsHistory(
        sportsHistory.map((sport) =>
          sport.id === sportId
            ? {
                ...sport,
                certificates: [...sport.certificates, { ...currentCertificate, id: Date.now().toString() }],
              }
            : sport
        )
      );
      setCurrentCertificate({
        id: '',
        eventName: '',
        eventType: '',
        certificateFile: null,
      });
    } else {
      alert('Por favor complete todos los campos del certificado');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentCertificate({
        ...currentCertificate,
        certificateFile: e.target.files[0],
      });
    }
  };

  const handleSubmit = () => {
    if (sportsHistory.length === 0) {
      alert('Debe agregar al menos un deporte');
      return;
    }
    // Aquí iría la lógica para enviar los datos al backend
    console.log('Historial deportivo:', sportsHistory);
    navigate('/measurements');
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#006837] mb-8">Historial Deportivo</h1>

      {/* Formulario para agregar deporte */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Agregar Deporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deporte
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent pl-10"
                placeholder="Buscar deporte..."
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            {showSuggestions && filteredSports.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-auto">
                {filteredSports.map((sport) => (
                  <div
                    key={sport}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSportSelect(sport)}
                  >
                    {sport}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Años de Experiencia
            </label>
            <input
              type="number"
              value={currentSport.yearsOfExperience}
              onChange={(e) => setCurrentSport({ ...currentSport, yearsOfExperience: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
              min="0"
            />
          </div>
        </div>
        <button
          onClick={handleAddSport}
          className="bg-[#006837] text-white px-4 py-2 rounded-xl hover:bg-[#005828] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Agregar Deporte
        </button>
      </div>

      {/* Lista de deportes y certificados */}
      {sportsHistory.map((sport) => (
        <div key={sport.id} className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{sport.sport}</h2>
            <p className="text-gray-600">{sport.yearsOfExperience} años de experiencia</p>
          </div>

          {/* Formulario para agregar certificado */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="text-lg font-medium mb-4">Agregar Certificado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  value={currentCertificate.eventName}
                  onChange={(e) => setCurrentCertificate({ ...currentCertificate, eventName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                  placeholder="Ej: Campeonato Nacional 2023"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Evento
                </label>
                <select
                  value={currentCertificate.eventType}
                  onChange={(e) => setCurrentCertificate({ ...currentCertificate, eventType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#006837] focus:border-transparent"
                >
                  <option value="">Seleccionar tipo...</option>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificado
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 px-4 py-2 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Upload size={20} className="text-gray-500" />
                  <span className="text-gray-600">
                    {currentCertificate.certificateFile
                      ? currentCertificate.certificateFile.name
                      : 'Seleccionar archivo'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <button
                  onClick={() => handleAddCertificate(sport.id)}
                  className="bg-[#006837] text-white px-4 py-2 rounded-xl hover:bg-[#005828] transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Agregar Certificado
                </button>
              </div>
            </div>
          </div>

          {/* Lista de certificados */}
          {sport.certificates.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium mb-4">Certificados Registrados</h3>
              <div className="space-y-4">
                {sport.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">{cert.eventName}</p>
                      <p className="text-sm text-gray-600">
                        {EVENT_TYPE_LABELS[cert.eventType] || cert.eventType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {cert.certificateFile?.name}
                      </span>
                      <button
                        onClick={() => {
                          setSportsHistory(
                            sportsHistory.map((s) =>
                              s.id === sport.id
                                ? {
                                    ...s,
                                    certificates: s.certificates.filter(
                                      (c) => c.id !== cert.id
                                    ),
                                  }
                                : s
                            )
                          );
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Botón de continuar */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-[#006837] text-white px-8 py-3 rounded-xl hover:bg-[#005828] transition-colors"
        >
          Guardar y Continuar
        </button>
      </div>
    </div>
  );
}; 