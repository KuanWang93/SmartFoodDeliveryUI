"use client";

import React, { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import apiClient from "@/services/apiClient";
import {
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  categoryId: number;
  name: string;
  sort: number;
  status: number; // 1=启用，0=停用
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新增表单状态
  const [newName, setNewName] = useState("");
  const [newSort, setNewSort] = useState<number>(1);

  // 编辑状态
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSort, setEditSort] = useState<number>(1);

  // 单条删除确认
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  // 批量删除确认
  const [confirmingBulk, setConfirmingBulk] = useState(false);
   // 已选中的 ID 列表
   const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Load categories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/merchant/categories");
      const list: Category[] = res.data.data;
      list.sort((a, b) => a.sort - b.sort);
      setCategories(list);
    } catch (e: any) {
      setError(e.message || "加载分类失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create
  const handleCreate = async () => {
    if (!newName.trim()) return toast.error("名称必填");
    try {
      const res = await apiClient.post("/merchant/categories", {
        name: newName,
        sort: newSort,
      });
      setNewName("");
      setNewSort(1);
      await fetchCategories();
      toast.success(res.data.msg || "新增成功");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Start edit
  const startEdit = (cat: Category) => {
    setEditingId(cat.categoryId);
    setEditName(cat.name);
    setEditSort(cat.sort);
  };
  // Cancel edit
  const cancelEdit = () => setEditingId(null);

  // Save edit
  const handleSave = async (categoryId: number) => {
    if (!editName.trim()) return toast.error("名称必填");
    try {
      const res = await apiClient.put(`/merchant/categories/${categoryId}`, {
        name: editName,
        sort: editSort,
      });
      setEditingId(null);
      await fetchCategories();
      toast.success(res.data.msg || "保存成功");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

   // 单条删除
   const askDelete = (id: number) => setConfirmingId(id);
   const handleDelete = async () => {
     if (confirmingId == null) return;
     try {
       const res = await apiClient.delete("/merchant/categories", {
         params: { categoryIds: [confirmingId] },
       });
       toast.success(res.data.msg);
       await fetchCategories();
       setSelectedIds((ids) => ids.filter((i) => i !== confirmingId));
     } catch (error: any) {
      const msg = error.response?.data?.msg ?? error.message ?? "删除失败";
      toast.error(msg);
     } finally {
       setConfirmingId(null);
     }
   };
 
   // 批量删除
   const askBulkDelete = () => setConfirmingBulk(true);
   const handleBulkDelete = async () => {
     setLoading(true);
     try {
       const res = await apiClient.delete("/merchant/categories", {
         params: { categoryIds: selectedIds },
       });
       toast.success(res.data.msg);
       await fetchCategories();
       setSelectedIds([]);
     } catch (error: any) {
      const msg = error.response?.data?.msg ?? error.message ?? "删除失败";
      toast.error(msg);
     } finally {
       setLoading(false);
       setConfirmingBulk(false);
     }
   };

  // Toggle status
  const toggleStatus = async (cat: Category) => {
    try {
      const newStatus = cat.status === 1 ? 0 : 1;
      const res = await apiClient.put(
        `/merchant/categories/${cat.categoryId}/status/${newStatus}`
      );
      await fetchCategories();
      toast.success(res.data.msg);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Checkbox change
  const onCheck = (id: number, checked: boolean) => {
    setSelectedIds(ids =>
      checked ? [...ids, id] : ids.filter(x => x !== id)
    );
  };

  return (
    <div className="space-y-6">
      {/* 顶部：新增表单 + 批量删除 */}
      <div className="flex items-center bg-white shadow rounded p-4 space-x-4">
        {/* 新增 */}
        <div className="flex-1 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">分类名称</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">排序</label>
            <input
              type="number"
              value={newSort}
              onChange={e => setNewSort(+e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Plus size={16} className="mr-1" /> 新增分类
          </button>
          {/* 批量删除 */}
          <button
            onClick={askBulkDelete}
            disabled={selectedIds.length === 0}
            className={`
              flex items-center px-4 py-2 rounded
              ${selectedIds.length > 0
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <Trash2 size={16} className="mr-1" /> 批量删除 ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full table-fixed">
          <colgroup>
            {/* 选择，名称，排序，操作，状态 */}
            {[
              <col key="select" className="w-1/12" />,
              <col key="name"   className="w-1/3" />,
              <col key="sort"   className="w-1/6" />,
              <col key="ops"    className="w-1/6" />,
              <col key="state"  className="w-1/6" />,
            ]}  
          </colgroup>
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">选择</th>
              <th className="px-4 py-2 text-left">名称</th>
              <th className="px-4 py-2 text-left">排序</th>
              <th className="px-4 py-2 text-center">操作</th>
              <th className="px-4 py-2 text-center">状态</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading">
                <td colSpan={5} className="p-4 text-center">
                  加载中...
                </td>
              </tr>
            ) : error ? (
              <tr key="error">
                <td colSpan={5} className="p-4 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr key="empty">
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  暂无分类
                </td>
              </tr>
            ) : (
              categories.map(cat => {
                const isEditing = editingId === cat.categoryId;
                return (
                  <tr key={cat.categoryId} className="hover:bg-gray-50">
                    {/* 选择 */}
                    <td className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cat.categoryId)}
                        onChange={e =>
                          onCheck(cat.categoryId, e.target.checked)
                        }
                      />
                    </td>

                    {/* 名称 */}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>

                    {/* 排序 */}
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editSort}
                          onChange={e => setEditSort(+e.target.value)}
                          className="w-16 p-1 border rounded"
                        />
                      ) : (
                        cat.sort
                      )}
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-2 flex justify-center space-x-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(cat.categoryId)}
                            className="flex items-center text-green-600 hover:underline"
                          >
                            <Check size={16} className="mr-1" />
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center text-gray-600 hover:underline"
                          >
                            <X size={16} className="mr-1" />
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat)}
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            <Edit2 size={16} className="mr-1" />
                            编辑
                          </button>
                          <button
                            onClick={() => askDelete(cat.categoryId)}
                            className="flex items-center text-red-600 hover:underline"
                          >
                            <Trash2 size={16} className="mr-1" />
                            删除
                          </button>
                        </>
                      )}
                    </td>

                    {/* 状态 */}
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => toggleStatus(cat)}
                        className="focus:outline-none"
                      >
                        {cat.status === 1 ? (
                          <ToggleRight
                            size={20}
                            className="text-green-600"
                          />
                        ) : (
                          <ToggleLeft
                            size={20}
                            className="text-gray-400"
                          />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* 单条删除确认 */}
      <ConfirmModal
        open={confirmingId !== null}
        message="确认要删除这个分类吗？此操作不可撤销。"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingId(null)}
      />
      {/* 批量删除确认 */}
      <ConfirmModal
        open={confirmingBulk}
        message={`确认要删除所选的 ${selectedIds.length} 个分类吗？此操作不可撤销。`}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmingBulk(false)}
      /> 
    </div>
  );
}