import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AspirantDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[#006837]">Detalles del Aspirante</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center text-[#006837]">
            Información del Aspirante #{id}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              En construcción
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};