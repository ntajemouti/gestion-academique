<?php

namespace Database\Seeders;

use App\Models\Absence;
use App\Models\Club;
use App\Models\Demande;
use App\Models\EmploiDuTemps;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Seeder;

use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Admin ─────────────────────────────────────────────
        $admin = User::updateOrCreate(
            ['matricule' => 'ADM001'],
            [
                'prenom'   => 'Admin',
                'nom'      => 'MyISTA',
                'email'    => 'admin@myista.ma',
                'password' => 'password',   // ← was unhashed — fixed
                'role'     => 'Administrateur',
                'statut'   => 'Actif',
            ]
        );

        // ── 2. Filieres ──────────────────────────────────────────
        $filDev = Filiere::firstOrCreate(
            ['code' => 'DEV'],
            [
                'nom'         => 'Développement Digital',
                'description' => 'Formation en développement web et mobile',
                'duree'       => 2,
                'color'       => '#2563eb',
                'statut'      => 'Actif',
            ]
        );

        $filInfra = Filiere::firstOrCreate(
            ['code' => 'INFRA'],
            [
                'nom'         => 'Infrastructure & Réseaux',
                'description' => 'Administration systèmes et réseaux',
                'duree'       => 2,
                'color'       => '#16a34a',
                'statut'      => 'Actif',
            ]
        );

        $filData = Filiere::firstOrCreate(
            ['code' => 'DATA'],
            [
                'nom'         => 'Data Science & IA',
                'description' => 'Analyse de données et intelligence artificielle',
                'duree'       => 2,
                'color'       => '#9333ea',
                'statut'      => 'Actif',
            ]
        );

        // ── 3. Formateurs ────────────────────────────────────────
        $form1 = User::firstOrCreate(
            ['email' => 'k.benali@myista.ma'],
            [
                'matricule'  => 'FOR001',
                'prenom'     => 'Karim',
                'nom'        => 'Benali',
                'password'   => 'password',
                'role'       => 'Formateur',
                'statut'     => 'Actif',
                'specialite' => 'Développement Web',
            ]
        );

        $form2 = User::firstOrCreate(
            ['email' => 'f.zahra@myista.ma'],
            [
                'matricule'  => 'FOR002',
                'prenom'     => 'Fatima',
                'nom'        => 'Zahra',
                'password'   => 'password',
                'role'       => 'Formateur',
                'statut'     => 'Actif',
                'specialite' => 'Réseaux & Sécurité',
            ]
        );

        $form3 = User::firstOrCreate(
            ['email' => 'y.idrissi@myista.ma'],
            [
                'matricule'  => 'FOR003',
                'prenom'     => 'Youssef',
                'nom'        => 'Idrissi',
                'password'   => 'password',
                'role'       => 'Formateur',
                'statut'     => 'Actif',
                'specialite' => 'Data Science',
            ]
        );

        // ── 4. Modules ───────────────────────────────────────────
        $mod1 = Module::firstOrCreate(['code' => 'WEB101'], ['nom' => 'Développement Web Frontend', 'filiere_id' => $filDev->id,   'formateur_id' => $form1->id, 'heures_par_semaine' => 8, 'coefficient' => 3]);
        $mod2 = Module::firstOrCreate(['code' => 'WEB201'], ['nom' => 'Développement Backend',      'filiere_id' => $filDev->id,   'formateur_id' => $form1->id, 'heures_par_semaine' => 6, 'coefficient' => 3]);
        $mod3 = Module::firstOrCreate(['code' => 'MOB101'], ['nom' => 'Développement Mobile',       'filiere_id' => $filDev->id,   'formateur_id' => $form1->id, 'heures_par_semaine' => 6, 'coefficient' => 2]);
        $mod4 = Module::firstOrCreate(['code' => 'NET101'], ['nom' => 'Réseaux Fondamentaux',       'filiere_id' => $filInfra->id, 'formateur_id' => $form2->id, 'heures_par_semaine' => 8, 'coefficient' => 3]);
        $mod5 = Module::firstOrCreate(['code' => 'SEC101'], ['nom' => 'Cybersécurité',              'filiere_id' => $filInfra->id, 'formateur_id' => $form2->id, 'heures_par_semaine' => 6, 'coefficient' => 3]);
        $mod6 = Module::firstOrCreate(['code' => 'DAT101'], ['nom' => 'Analyse de Données',         'filiere_id' => $filData->id,  'formateur_id' => $form3->id, 'heures_par_semaine' => 8, 'coefficient' => 4]);

        // ── 5. Groupes ───────────────────────────────────────────
        $grpDev1 = Groupe::firstOrCreate(
            ['nom' => 'DEV-A', 'filiere_id' => $filDev->id],
            [
                'niveau'                 => '1ère année',
                'annee'                  => '2024-2025',
                'formateur_referent_id'  => $form1->id,
                'statut'                 => 'Actif',
            ]
        );

        $grpDev2 = Groupe::firstOrCreate(
            ['nom' => 'DEV-B', 'filiere_id' => $filDev->id],
            [
                'niveau'                 => '2ème année',
                'annee'                  => '2024-2025',
                'formateur_referent_id'  => $form1->id,
                'statut'                 => 'Actif',
            ]
        );

        $grpInfra1 = Groupe::firstOrCreate(
            ['nom' => 'INFRA-A', 'filiere_id' => $filInfra->id],
            [
                'niveau'                 => '1ère année',
                'annee'                  => '2024-2025',
                'formateur_referent_id'  => $form2->id,
                'statut'                 => 'Actif',
            ]
        );

        $grpData1 = Groupe::firstOrCreate(
            ['nom' => 'DATA-A', 'filiere_id' => $filData->id],
            [
                'niveau'                 => '1ère année',
                'annee'                  => '2024-2025',
                'formateur_referent_id'  => $form3->id,
                'statut'                 => 'Actif',
            ]
        );

        // ── 6. Stagiaires ────────────────────────────────────────
        $sta1 = User::firstOrCreate(
            ['email' => 'a.ouali@myista.ma'],
            ['matricule' => 'STA001', 'prenom' => 'Ahmed',  'nom' => 'Ouali',     'password' => 'password', 'role' => 'Stagiaire', 'statut' => 'Actif', 'filiere_id' => $filDev->id,   'groupe_id' => $grpDev1->id]
        );
        $sta2 = User::firstOrCreate(
            ['email' => 'n.benhaddou@myista.ma'],
            ['matricule' => 'STA002', 'prenom' => 'Nadia',  'nom' => 'Benhaddou', 'password' => 'password', 'role' => 'Stagiaire', 'statut' => 'Actif', 'filiere_id' => $filDev->id,   'groupe_id' => $grpDev1->id]
        );
        $sta3 = User::firstOrCreate(
            ['email' => 'o.tazi@myista.ma'],
            ['matricule' => 'STA003', 'prenom' => 'Omar',   'nom' => 'Tazi',      'password' => 'password', 'role' => 'Stagiaire', 'statut' => 'Actif', 'filiere_id' => $filInfra->id, 'groupe_id' => $grpInfra1->id]
        );
        $sta4 = User::firstOrCreate(
            ['email' => 's.el-amrani@myista.ma'],
            ['matricule' => 'STA004', 'prenom' => 'Sara',   'nom' => 'El Amrani', 'password' => 'password', 'role' => 'Stagiaire', 'statut' => 'Actif', 'filiere_id' => $filDev->id,   'groupe_id' => $grpDev2->id]
        );
        $sta5 = User::firstOrCreate(
            ['email' => 'y.chraibi@myista.ma'],
            ['matricule' => 'STA005', 'prenom' => 'Yassine','nom' => 'Chraibi',   'password' => 'password', 'role' => 'Stagiaire', 'statut' => 'Actif', 'filiere_id' => $filData->id,  'groupe_id' => $grpData1->id]
        );

        // ── 7. Notes ─────────────────────────────────────────────
        $notesToSeed = [
            ['stagiaire_id' => $sta1->id, 'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'note' => 15.5, 'coefficient' => 3, 'date_evaluation' => '2025-01-15', 'type_evaluation' => 'Contrôle'],
            ['stagiaire_id' => $sta1->id, 'module_id' => $mod2->id, 'formateur_id' => $form1->id, 'note' => 13.0, 'coefficient' => 3, 'date_evaluation' => '2025-01-20', 'type_evaluation' => 'Contrôle'],
            ['stagiaire_id' => $sta1->id, 'module_id' => $mod3->id, 'formateur_id' => $form1->id, 'note' => 14.5, 'coefficient' => 2, 'date_evaluation' => '2025-02-05', 'type_evaluation' => 'Examen'],
            ['stagiaire_id' => $sta2->id, 'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'note' => 17.0, 'coefficient' => 3, 'date_evaluation' => '2025-01-15', 'type_evaluation' => 'Contrôle'],
            ['stagiaire_id' => $sta2->id, 'module_id' => $mod2->id, 'formateur_id' => $form1->id, 'note' => 16.0, 'coefficient' => 3, 'date_evaluation' => '2025-01-20', 'type_evaluation' => 'Contrôle'],
            ['stagiaire_id' => $sta3->id, 'module_id' => $mod4->id, 'formateur_id' => $form2->id, 'note' => 11.5, 'coefficient' => 3, 'date_evaluation' => '2025-01-18', 'type_evaluation' => 'Examen'],
            ['stagiaire_id' => $sta3->id, 'module_id' => $mod5->id, 'formateur_id' => $form2->id, 'note' => 12.0, 'coefficient' => 3, 'date_evaluation' => '2025-02-10', 'type_evaluation' => 'Contrôle'],
            ['stagiaire_id' => $sta4->id, 'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'note' => 18.0, 'coefficient' => 3, 'date_evaluation' => '2025-01-15', 'type_evaluation' => 'Contrôle'],
            ['stagiaire_id' => $sta5->id, 'module_id' => $mod6->id, 'formateur_id' => $form3->id, 'note' => 14.0, 'coefficient' => 4, 'date_evaluation' => '2025-01-22', 'type_evaluation' => 'Examen'],
        ];

        foreach ($notesToSeed as $note) {
            Note::firstOrCreate(
                ['stagiaire_id' => $note['stagiaire_id'], 'module_id' => $note['module_id'], 'date_evaluation' => $note['date_evaluation']],
                $note
            );
        }

        // ── 8. Absences ──────────────────────────────────────────
        $absencesToSeed = [
            ['stagiaire_id' => $sta1->id, 'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'date' => '2025-01-10', 'justifiee' => false],
            ['stagiaire_id' => $sta2->id, 'module_id' => $mod2->id, 'formateur_id' => $form1->id, 'date' => '2025-01-12', 'justifiee' => true,  'motif' => 'Maladie'],
            ['stagiaire_id' => $sta3->id, 'module_id' => $mod4->id, 'formateur_id' => $form2->id, 'date' => '2025-01-14', 'justifiee' => false],
            ['stagiaire_id' => $sta1->id, 'module_id' => $mod2->id, 'formateur_id' => $form1->id, 'date' => '2025-02-03', 'justifiee' => true,  'motif' => 'Rendez-vous médical'],
            ['stagiaire_id' => $sta4->id, 'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'date' => '2025-02-10', 'justifiee' => false],
        ];

        foreach ($absencesToSeed as $absence) {
            Absence::firstOrCreate(
                ['stagiaire_id' => $absence['stagiaire_id'], 'module_id' => $absence['module_id'], 'date' => $absence['date']],
                $absence
            );
        }

        // ── 9. Clubs ─────────────────────────────────────────────
        $clubCode = Club::firstOrCreate(
            ['nom' => 'Club Coding'],
            ['description' => 'Hackathons et projets open source', 'responsable_id' => $form1->id, 'capacite_max' => 30, 'icon' => 'code',    'statut' => 'Actif']
        );
        $clubRobo = Club::firstOrCreate(
            ['nom' => 'Club Robotique'],
            ['description' => 'IoT et robotique',                 'responsable_id' => $form2->id, 'capacite_max' => 20, 'icon' => 'cpu',     'statut' => 'Actif']
        );
        $clubPhoto = Club::firstOrCreate(
            ['nom' => 'Club Photo & Vidéo'],
            ['description' => 'Création de contenu multimédia',   'responsable_id' => $form3->id, 'capacite_max' => 15, 'icon' => 'camera',  'statut' => 'Actif']
        );

        // Attach members (sync avoids duplicate pivot errors)
        $clubCode->membres()->syncWithoutDetaching([$sta1->id => ['joined_at' => now()], $sta2->id => ['joined_at' => now()], $sta4->id => ['joined_at' => now()]]);
        $clubRobo->membres()->syncWithoutDetaching([$sta3->id => ['joined_at' => now()]]);
        $clubPhoto->membres()->syncWithoutDetaching([$sta5->id => ['joined_at' => now()]]);

        // ── 10. Demandes ─────────────────────────────────────────
        Demande::firstOrCreate(
            ['user_id' => $sta1->id, 'type' => 'Attestation de présence'],
            ['description' => 'Pour dossier visa', 'statut' => 'En attente']
        );
        Demande::firstOrCreate(
            ['user_id' => $sta2->id, 'type' => 'Relevé de notes'],
            ['description' => 'Candidature emploi', 'statut' => 'Approuvée', 'traite_par' => $admin->id, 'traite_le' => now()]
        );
        Demande::firstOrCreate(
            ['user_id' => $sta3->id, 'type' => 'Certificat de scolarité'],
            ['description' => 'Dossier banque', 'statut' => 'En attente']
        );

        // ── 11. Emplois du temps ─────────────────────────────────
        $slots = [
            ['groupe_id' => $grpDev1->id,   'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'jour' => 'Lundi',    'heure_debut' => '08:30', 'heure_fin' => '10:30', 'salle' => 'Labo 1'],
            ['groupe_id' => $grpDev1->id,   'module_id' => $mod2->id, 'formateur_id' => $form1->id, 'jour' => 'Mardi',    'heure_debut' => '10:30', 'heure_fin' => '12:30', 'salle' => 'Salle A2'],
            ['groupe_id' => $grpDev1->id,   'module_id' => $mod3->id, 'formateur_id' => $form1->id, 'jour' => 'Mercredi', 'heure_debut' => '08:30', 'heure_fin' => '10:30', 'salle' => 'Labo 2'],
            ['groupe_id' => $grpDev1->id,   'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'jour' => 'Jeudi',    'heure_debut' => '14:00', 'heure_fin' => '16:00', 'salle' => 'Labo 1'],
            ['groupe_id' => $grpDev2->id,   'module_id' => $mod1->id, 'formateur_id' => $form1->id, 'jour' => 'Lundi',    'heure_debut' => '10:30', 'heure_fin' => '12:30', 'salle' => 'Salle A3'],
            ['groupe_id' => $grpDev2->id,   'module_id' => $mod2->id, 'formateur_id' => $form1->id, 'jour' => 'Mercredi', 'heure_debut' => '10:30', 'heure_fin' => '12:30', 'salle' => 'Salle A2'],
            ['groupe_id' => $grpInfra1->id, 'module_id' => $mod4->id, 'formateur_id' => $form2->id, 'jour' => 'Lundi',    'heure_debut' => '14:00', 'heure_fin' => '16:00', 'salle' => 'Salle B1'],
            ['groupe_id' => $grpInfra1->id, 'module_id' => $mod5->id, 'formateur_id' => $form2->id, 'jour' => 'Jeudi',    'heure_debut' => '08:30', 'heure_fin' => '10:30', 'salle' => 'Salle B2'],
            ['groupe_id' => $grpData1->id,  'module_id' => $mod6->id, 'formateur_id' => $form3->id, 'jour' => 'Mardi',    'heure_debut' => '08:30', 'heure_fin' => '10:30', 'salle' => 'Labo 3'],
            ['groupe_id' => $grpData1->id,  'module_id' => $mod6->id, 'formateur_id' => $form3->id, 'jour' => 'Vendredi', 'heure_debut' => '10:30', 'heure_fin' => '12:30', 'salle' => 'Labo 3'],
        ];

        foreach ($slots as $slot) {
            \App\Models\EmploiDuTemps::firstOrCreate(
                ['groupe_id' => $slot['groupe_id'], 'module_id' => $slot['module_id'], 'jour' => $slot['jour'], 'heure_debut' => $slot['heure_debut']],
                $slot
            );
        }

        $this->command->info('✅  MyISTA seed terminé.');
        $this->command->info('   Admin      → admin@myista.ma / password');
        $this->command->info('   Formateur  → k.benali@myista.ma / password');
        $this->command->info('   Stagiaire  → a.ouali@myista.ma / password');
    }
}
