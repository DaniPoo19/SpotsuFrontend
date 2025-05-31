import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';
import { attachedDocumentsService } from '../services/attached-documents.service';
import { sportsAchievementsService } from '../services/sports-achievements.service';
import { FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axiosInstance from '../api/axios';
import { ApiResponse } from '../types/dtos';

interface DocumentUploadProps {
  postulationId: string;
  documentTypeId: string;
  label: string;
  onUploadSuccess?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = React.memo(({
  postulationId,
  documentTypeId,
  label,
  onUploadSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor seleccione un archivo');
      return;
    }

    try {
      setIsUploading(true);
      await attachedDocumentsService.uploadDocument({
        postulation_id: postulationId,
        attached_document_type_id: documentTypeId,
        file: selectedFile
      });
      
      toast.success('Documento subido correctamente');
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al subir el documento');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">{label}</Label>
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="flex-1"
        />
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="bg-[#006837] hover:bg-[#005828]"
        >
          {isUploading ? 'Subiendo...' : 'Subir'}
        </Button>
      </div>
      {selectedFile && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <p className="truncate" title={selectedFile.name}>
            {selectedFile.name}
          </p>
        </div>
      )}
    </div>
  );
});

DocumentUpload.displayName = 'DocumentUpload';

interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Hierarchy {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

const achievementFormSchema = z.object({
  sport_competition_category_id: z.string().min(1, "Debe seleccionar una categoría"),
  competition_hierarchy_id: z.string().min(1, "Debe seleccionar una jerarquía"),
  score: z.number().min(0, "La puntuación debe ser mayor o igual a 0")
});

type AchievementFormData = z.infer<typeof achievementFormSchema>;

export const SportsHistory = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<AchievementFormData>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      sport_competition_category_id: "",
      competition_hierarchy_id: "",
      score: 0
    }
  });

  const DOCUMENT_TYPE_IDS = {
    MEDICAL_CERTIFICATE: '1',
    INFORMED_CONSENT: '2',
    ACHIEVEMENT_CERTIFICATE: '3'
  };

  const postulationId = '123'; // Reemplazar con el ID real

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [categoriesData, hierarchiesData] = await Promise.all([
        axiosInstance.get<ApiResponse<Category[]>>('/sports-competition-categories'),
        axiosInstance.get<ApiResponse<Hierarchy[]>>('/competition-hierarchy')
      ]);
      setCategories(categoriesData.data.data.filter(cat => cat.is_active));
      setHierarchies(hierarchiesData.data.data.filter(hier => hier.is_active));
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDocumentUploadSuccess = useCallback((documentType: string) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: true
    }));
  }, []);

  const handleSubmit = async (values: AchievementFormData) => {
    try {
      setIsSubmitting(true);

      const requiredDocuments = [
        DOCUMENT_TYPE_IDS.MEDICAL_CERTIFICATE,
        DOCUMENT_TYPE_IDS.INFORMED_CONSENT,
        DOCUMENT_TYPE_IDS.ACHIEVEMENT_CERTIFICATE
      ];

      const missingDocuments = requiredDocuments.filter(
        docId => !uploadedDocuments[docId]
      );

      if (missingDocuments.length > 0) {
        toast.error('Por favor suba todos los documentos requeridos');
        return;
      }

      await sportsAchievementsService.create({
        ...values,
        postulation_id: postulationId
      });

      toast.success('Logro guardado correctamente');
      form.reset();
      setUploadedDocuments({});
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el logro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#006837]">
              Historial Deportivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUpload
              postulationId={postulationId}
              documentTypeId={DOCUMENT_TYPE_IDS.MEDICAL_CERTIFICATE}
              label="Certificado Médico"
              onUploadSuccess={() => handleDocumentUploadSuccess(DOCUMENT_TYPE_IDS.MEDICAL_CERTIFICATE)}
            />
            
            <DocumentUpload
              postulationId={postulationId}
              documentTypeId={DOCUMENT_TYPE_IDS.INFORMED_CONSENT}
              label="Consentimiento Informado"
              onUploadSuccess={() => handleDocumentUploadSuccess(DOCUMENT_TYPE_IDS.INFORMED_CONSENT)}
            />
            
            <DocumentUpload
              postulationId={postulationId}
              documentTypeId={DOCUMENT_TYPE_IDS.ACHIEVEMENT_CERTIFICATE}
              label="Certificado de Logro"
              onUploadSuccess={() => handleDocumentUploadSuccess(DOCUMENT_TYPE_IDS.ACHIEVEMENT_CERTIFICATE)}
            />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="sport_competition_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría de Competencia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="competition_hierarchy_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jerarquía de Competencia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una jerarquía" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hierarchies.map(hierarchy => (
                            <SelectItem key={hierarchy.id} value={hierarchy.id}>
                              {hierarchy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntuación</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-[#006837] hover:bg-[#005828]"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Logro'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 