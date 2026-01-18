import React, { useState, useEffect } from 'react';
import { db, generateId } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

const RoleSettings = () => {
    const roles = useLiveQuery(() => db.roles.filter(role => !role.deleted_at).toArray());
    const permissions = useLiveQuery(() => db.permissions.toArray());
    
    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    
    // Group permissions by category (prefix before dot)
    const permissionGroups = (permissions || []).reduce((acc, p) => {
        const [category] = p.slug.split('.');
        if (!acc[category]) acc[category] = [];
        acc[category].push(p);
        return acc;
    }, {});

    const handleEdit = async (role) => {
        setCurrentRole(role);
        setRoleName(role.name);
        // Load existing permissions
        // Note: role_permissions schema is '[role_id+permission_id], role_id, permission_id, syncStatus'
        // Using filter() instead of where() to avoid compound index issues if role_id is part of key
        const allPerms = await db.role_permissions.toArray();
        const perms = allPerms.filter(p => p.role_id === role.id);
        
        setSelectedPermissions(perms.map(p => p.permission_id));
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentRole(null);
        setRoleName('');
        setSelectedPermissions([]);
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let roleId = currentRole?.id;

            if (currentRole) {
                // Update
                await db.roles.update(roleId, {
                    name: roleName,
                    syncStatus: 'pending',
                    updated_at: new Date().toISOString()
                });
            } else {
                // Create (generate UUID)
                roleId = generateId(); 
                await db.roles.add({
                    id: roleId,
                    name: roleName,
                    syncStatus: 'pending',
                    created_at: new Date().toISOString(),
                    deleted_at: null
                });
            }

            // Handle Permissions (Full replace strategy for simplicity local)
            // 1. Remove old permissions for this role
            if (currentRole) {
                const allPerms = await db.role_permissions.toArray();
                const oldPerms = allPerms.filter(p => p.role_id === roleId);
                
                // Dexie composite key: [role_id, permission_id]. Ensure correct types.
                // Both role_id and permission_id might be numbers or strings depending on origin.
                if (oldPerms.length > 0) {
                    await db.role_permissions.bulkDelete(oldPerms.map(p => [p.role_id, p.permission_id]));
                }
            }

            // 2. Add new permissions
            const newPerms = selectedPermissions.map(permId => ({
                role_id: roleId,
                permission_id: permId,
                syncStatus: 'pending'
            }));
            await db.role_permissions.bulkAdd(newPerms);

            setIsEditing(false);
        } catch (error) {
            console.error("Error saving role:", error);
            alert("Error al guardar el rol");
        }
    };

    const handleDelete = async (roleId) => {
        if (window.confirm('¿Estás seguro de eliminar este rol?')) {
            await db.roles.update(roleId, {
                deleted_at: new Date().toISOString(),
                syncStatus: 'pending'
            });
        }
    };

    const togglePermission = (permId) => {
        setSelectedPermissions(prev => 
            prev.includes(permId) 
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-700">
                        {currentRole ? 'Editar Rol' : 'Nuevo Rol'}
                    </h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                        Cancelar
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Nombre del Rol</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 outline-none"
                            value={roleName}
                            onChange={e => setRoleName(e.target.value)}
                            placeholder="Ej. Veterinario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-3">Permisos Asignados</label>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {Object.entries(permissionGroups).map(([category, perms]) => (
                                <div key={category} className="border border-slate-100 rounded-lg p-4">
                                    <h4 className="font-semibold text-slate-700 capitalize mb-3 border-b border-slate-100 pb-2">
                                        {category}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {perms.map(p => (
                                            <label key={p.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(p.id)}
                                                    onChange={() => togglePermission(p.id)}
                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <span className="text-sm text-slate-600">{p.slug}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {(!permissions || permissions.length === 0) && (
                                <p className="text-sm text-slate-400 italic">No hay permisos sincronizados. Conecta a internet para descargar la lista.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg shadow-primary-500/20"
                        >
                            Guardar Rol
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Roles y Permisos</h3>
                    <p className="text-sm text-slate-500">Define los perfiles de acceso para los usuarios de la granja.</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nuevo Rol</span>
                </button>
            </div>

            <div className="grid gap-4">
                {roles?.map(role => (
                    <div key={role.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <h4 className="font-bold text-slate-800">{role.name}</h4>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">ID: {role.id}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(role)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar permisos"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => handleDelete(role.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar rol"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
                {(!roles || roles.length === 0) && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p>No hay roles definidos.</p>
                        <p className="text-sm mt-1">Crea el primero para empezar a asignar permisos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleSettings;
