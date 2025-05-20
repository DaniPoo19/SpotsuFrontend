import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Home = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center text-[#006837]">
            Bienvenido al Sistema SPOSTU
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Sistema de Postulación y Seguimiento de Talento Universitario
            </p>
            <p className="text-gray-600">
              Universidad de Córdoba
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 