"use client"

import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, Trash, ArrowLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableRoleSelect } from "@/components/searchable-select-role"
import { is } from "drizzle-orm"


// Define types for the category and subtask
type SubTask = {
  id: number
  name: string
  roles: RoleDetail
  role_id: number
  standard_time: number
  is_preparation: boolean
  is_parallel: boolean
  index?: number
}

type Category = {
  id: number
  name: string
  subtasks: SubTask[]
}

type RoleDetail = {
  id: number;
  name: string;
  display_name: string;
};

export default function TaskCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [editingSubTask, setEditingSubTask] = useState<{categoryId: number, subtask: SubTask} | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [is_preparationTask, setIsPreparationTask] = useState(false)
  const [is_parallelTask, setIsParallelTask] = useState(false)
  const [editIsPreparationTask, setEditIsPreparationTask] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null)

  // Roles for dropdown selection
  const roles = [
    { id: "Mold Checker", name: "Mold Checker" },
    { id: "Robot Operator", name: "Robot Operator" },
    { id: "Maintenance", name: "Maintenance" },
    { id: "Quality", name: "Quality" },
  ]

  // Hours for preparation tasks
  const preparationHours = [
    { value: 1440, label: "h-1" },
    { value: 2880, label: "h-2" },
  ]

  const index = [
    {id: 1, value: 1, color: "bg-yellow-200"},
    {id: 2, value: 2, color: "bg-green-200"},
    {id: 3, value: 3, color: "bg-blue-200"},
  ]

  // Fetch categories and subtasks from API
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/qco/api/task_categories`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      } else {
        console.error("Failed to fetch categories:", data.message)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      // For demo purposes, populate with sample data if the API fails
      // setCategories([
      //   {
      //     id: 1,
      //     name: "Change Over BP",
      //     subtasks: [
      //       { id: 1, name: "Mold Check", role: "Mold Checker", standard_time: 2880, is_preparation: true, role_id: 1, is_parallel: false },
      //       { id: 2, name: "Persiapan Jig Robot", role: "Robot Operator", standard_time: 1440, is_preparation: true, role_id: 2, is_parallel: false },
      //       { id: 3, name: "Cleaning Hopper & Crusher", role: "Maintenance", standard_time: 45, is_preparation: false, role_id: 3, is_parallel: true, index: 1 },
      //       { id: 4, name: "Set Up Mold", role: "Maintenance", standard_time: 45, is_preparation: false, role_id: 4, is_parallel: true, index: 1},
      //       { id: 5, name: "Purging", role: "Maintenance", standard_time: 30, is_preparation: false, role_id: 5, is_parallel: true, index: 2 },
      //       { id: 6, name: "Setting Parameter Mesin", role: "Maintenance", standard_time: 35, is_preparation: false, role_id: 6, is_parallel: true, index: 2 },
      //       { id: 7, name: "Setting Robot", role: "Robot Operator", standard_time: 15, is_preparation: false, role_id: 7, is_parallel: false },
      //       { id: 8, name: "Validasi SUBO", role: "Quality", standard_time: 30, is_preparation: false, role_id: 8, is_parallel: false }
      //     ]
      //   }
      // ])
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Set edit preparation state when an existing subtask is being edited
  useEffect(() => {
    if (editingSubTask) {
      setEditIsPreparationTask(editingSubTask.subtask.is_preparation)
    }
  }, [editingSubTask])

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add a new category
  const addCategory = async (newCategory: Omit<Category, "id" | "subtasks">) => {
    return await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCategory, subtasks: [] })
      })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to add category')
        fetchCategories()
      }),
      {
        loading: 'Creating new category...',
        success: 'Category created successfully',
        error: (err) => `Error: ${err.message}`
      }
    )
  }

  // Update a category
  const updateCategory = async (updatedCategory: Category) => {
    return await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${updatedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
      })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to update category')
        fetchCategories()
      }),
      {
        loading: 'Updating category...',
        success: 'Category updated successfully',
        error: (err) => `Error: ${err.message}`
      }
    )
  }

  // Delete a category
  const deleteCategory = async (id: number) => {
    return await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${id}`, {
        method: 'DELETE'
      })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to delete category')
        fetchCategories()
      }),
      {
        loading: 'Deleting category...',
        success: 'Category deleted successfully',
        error: (err) => `Error: ${err.message}`
      }
    )
  }

  // Add a subtask to a category
  const addSubTask = async (categoryId: number, newSubTask: Omit<SubTask, "id" | "roles">) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    return await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${categoryId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSubTask, roles: [] })
      })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to add subtask')
        fetchCategories()
      }),
      {
        loading: 'Adding subtask...',
        success: 'Subtask added successfully',
        error: (err) => `Error: ${err.message}`
      }
    )
  }

  // Update a subtask
  const updateSubTask = async (categoryId: number, updatedSubTask: Omit<SubTask, "roles">) => {
    return await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${categoryId}/subtasks/${updatedSubTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSubTask)
      })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to update subtask')
        fetchCategories()
      }),
      {
        loading: 'Updating subtask...',
        success: 'Subtask updated successfully',
        error: (err) => `Error: ${err.message}`
      }
    )
  }

  // Delete a subtask
  const deleteSubTask = async (categoryId: number, subtaskId: number) => {
    return await toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${categoryId}/subtasks/${subtaskId}`, {
        method: 'DELETE'
      })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to delete subtask')
        fetchCategories()
      }),
      {
        loading: 'Deleting subtask...',
        success: 'Subtask deleted successfully',
        error: (err) => `Error: ${err.message}`
      }
    )
  }

  // Handle submission for adding a new subtask
  const handleSubtaskSubmit = (e: React.FormEvent<HTMLFormElement>, categoryId: number) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Get the preparation time based on whether it's a preparation task or not
    let standard_time: number
    if (is_preparationTask) {
      standard_time = formData.get('preparationHour') as unknown as number
    } else {
      standard_time = formData.get('preparationMinutes') as unknown as number
    }
    
    const newSubTask = {
      name: formData.get('name') as string,
      role: "",
      role_id: selectedRole?.id || -1,
      standard_time,
      is_preparation: is_preparationTask,
      is_parallel: is_parallelTask,
      index: formData.get('index') as unknown as number,
      
    }
    
    addSubTask(categoryId, newSubTask)
    e.currentTarget.reset()
    setIsPreparationTask(false) // Reset the checkbox state
  }

  // Handle submission for editing an existing subtask
  const handleEditSubtaskSubmit = (e: React.FormEvent<HTMLFormElement>, categoryId: number, subtaskId: number) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Get the preparation time based on whether it's a preparation task or not
    let standard_time= 0
    if (editIsPreparationTask) {
      standard_time = formData.get('preparationHour') as unknown as number
    } else {
      standard_time = formData.get('preparationMinutes') as unknown as number
    }
    
    const updatedSubTask = {
      id: subtaskId,
      name: formData.get('name') as string,
      role: '',
      role_id: selectedRole?.id || -1,
      standard_time,
      is_preparation: editIsPreparationTask,
      is_parallel: is_parallelTask,
      index: formData.get('index') as unknown as number,
    }
    
    updateSubTask(categoryId, updatedSubTask)
    setEditingSubTask(null)
    setEditIsPreparationTask(false) // Reset the checkbox state
  }

  // Render the category management UI
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      {!selectedCategory ? (
        // Categories List View
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Task Categories</h2>
              <p className="text-muted-foreground">
                Manage production task categories and subtasks
              </p>
            </div>
            <div className="ml-auto px-3 space-x-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Enter the name of the new task category.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const newCategory = {
                      name: formData.get('name') as string,
                    }
                    addCategory(newCategory)
                    e.currentTarget.reset()
                  }}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nama kategori
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          className="col-span-3"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Category</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center space-x-2">
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-[150px] lg:w-[250px]"
                />
                {searchTerm && (
                  <Button variant="ghost" onClick={() => setSearchTerm('')}>Clear</Button>
                )}
              </div>
            </div>
            
            <div className="rounded-md border">
              {filteredCategories.map(category => (
                <div key={category.id} className="border-b p-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <button 
                      className="text-lg font-medium flex-1 text-left hover:underline"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.name}
                    </button>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        // Category Detail View
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedCategory(null)}
              >
                <ArrowLeft className="h-8 w-8 mr-2" />
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">{selectedCategory.name}</h2>
            </div>
            <div className="ml-auto px-3 space-x-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subtask
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Subtask</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new subtask.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => handleSubtaskSubmit(e, selectedCategory.id)}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nama sub task
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4 w-full">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <div className="col-span-3">
                        <SearchableRoleSelect value={selectedRole} onValueChange={setSelectedRole}/>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="is_preparation" className="text-right">
                          Sub task persiapan
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_preparation"
                            name="is_preparation"
                            checked={is_preparationTask}
                            onChange={(e) => setIsPreparationTask(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="standard_time" className="text-right">
                          {is_preparationTask ? "Waktu persiapan" : "Durasi"}
                        </Label>
                        <div className="col-span-3">
                          {is_preparationTask ? (
                            <Select name="preparationHour" defaultValue="h-2">
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select hours" />
                              </SelectTrigger>
                              <SelectContent>
                                {preparationHours.map(hour => (
                                  <SelectItem key={hour.value} value={String(hour.value)}>
                                    {hour.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                id="preparationMinutes"
                                name="preparationMinutes"
                                type="number"
                                min="1"
                                placeholder="Duration"
                                className="flex-1"
                                required
                              />
                              <span className="text-muted-foreground">minutes</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="is_parallel" className="text-right">
                          Sub task Parallel
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_parallel"
                            name="is_parallel"
                            checked={is_parallelTask}
                            onChange={(e) => setIsParallelTask(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      </div>

                      { is_parallelTask ? (
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="index" className="text-right">
                          Index
                        </Label>
                        <div className="col-span-3">
                          
                            <Select name="index" defaultValue="h-2">
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Index" />
                              </SelectTrigger>
                              <SelectContent>
                                {index.map(i => (
                                  <SelectItem key={i.value} value={String(i.value)}>
                                    {i.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Label className="text-xs text-muted-foreground">
                            (Subtask yang Parallel harus memiliki index yang sama)
                          </Label>
                        </div>
                      </div>) : <></>}

                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Subtask</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="rounded-md border">
              {selectedCategory.subtasks.map(subtask => (
                <div key={subtask.id} className={`border-b p-4 last:border-b-0 ${subtask.is_parallel && subtask.index ? index.find(i => i.value === subtask.index)?.color : ""}`}>
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{subtask.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{subtask.roles.display_name}</span>
                    <span>{subtask.standard_time} min</span>
                    {subtask.is_preparation && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Preparation</span>
                    )}
                    {subtask.is_parallel && (
                      <span className={`${index.find(i => i.value === subtask.index)?.color}  px-2 py-0.5 rounded-full text-xs`}>Parallel {subtask.index}</span>
                    )}
                    </div>
                  </div>
                  <div>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingSubTask({ categoryId: selectedCategory.id, subtask })}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this subtask?')) {
                        deleteSubTask(selectedCategory.id, subtask.id)
                        }
                      }}
                      >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Timeline View when a category is selected */}
        {selectedCategory && (
          <div className="space-y-2 h-full">
            <div className="border rounded-md p-4">
          <h3 className="text-lg font-semibold mb-4">Timeline View</h3>
          
          <div className="relative overflow-x-auto">
            {/* Timeline header */}
            <div className="flex border-b pb-2 mb-2">
              <div className="w-48 font-medium">Task</div>
              <div className="flex-1 relative">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute top-0 bottom-0 border-l text-xs text-muted-foreground"
                style={{ left: `${i * 10}%` }}
              >
                {i * 15} min
              </div>
            ))}
              </div>
            </div>
            
            {/* Timeline content */}
            <div className="space-y-2 min-h-[340px]">
              {/* Preparation tasks */}
              {selectedCategory.subtasks
            .filter(task => task.is_preparation)
            .sort((a, b) => a.id - b.id)
            .map(task => (
              <div key={`prep-${task.id}`} className="flex items-center h-8">
                <div className="w-48 text-sm truncate pt-4">{task.name}</div>
                <div className="flex-1 relative">
              <div 
                className="absolute h-6 bg-blue-100 border border-blue-300 rounded-md px-2 flex items-center text-xs"
                style={{ width: '100%' }}
              >
                <span className="truncate">{task.roles.display_name} (Preparation)</span>
              </div>
                </div>
              </div>
            ))}
              
              {(() => {
            // Group tasks by parallel index
            const parallelGroups: {[key: number]: SubTask[]} = {};
            const regularTasks = selectedCategory.subtasks
              .filter(task => !task.is_preparation)
              .sort((a, b) => a.id - b.id); // Sort by ID ascending
            
            // Collect parallel tasks
            regularTasks
              .filter(task => task.is_parallel && task.index)
              .forEach(task => {
                if (!parallelGroups[task.index as number]) {
              parallelGroups[task.index as number] = [];
                }
                parallelGroups[task.index as number].push(task);
              });
            
            // Sort parallel tasks by ID within each group
            Object.keys(parallelGroups).forEach(key => {
              parallelGroups[Number(key)].sort((a, b) => a.id - b.id);
            });
            
            // Calculate total task time for scale
            let totalTime = regularTasks.reduce((acc, task) => {
              if (!task.is_parallel) {
                return acc + task.standard_time;
              }
              return acc;
            }, 0);
            
            // Add the max time from each parallel group
            Object.values(parallelGroups).forEach(group => {
              const maxTime = Math.max(...group.map(t => t.standard_time));
              totalTime += maxTime;
            });
            
            const scale = 100 / Math.max(totalTime, 150); // Use at least 150 min for scale
            
            // Render tasks in sequence according to their IDs
            let currentPosition = 0;
            const taskElements: JSX.Element[] = [];
            const processedIds = new Set<number>();
            
            regularTasks.forEach(task => {
              // Skip if we've already processed this task
              if (processedIds.has(task.id)) return;
              
              if (task.is_parallel && task.index) {
                const parallelGroup = parallelGroups[task.index];
                
                // Only process if this is the first task of its group we encounter
                if (parallelGroup && !parallelGroup.some(t => processedIds.has(t.id))) {
              const maxTime = Math.max(...parallelGroup.map(t => t.standard_time));
              
              // Mark all tasks in this group as processed
              parallelGroup.forEach(t => processedIds.add(t.id));
              
              // Render parallel group
              taskElements.push(
                <div key={`group-${task.index}`} className="flex flex-col space-y-1 mt-2 mb-2">
                  {/* <div className="text-xs font-medium text-muted-foreground ml-48 mb-1">
                Parallel Group {task.index}
                  </div> */}
                  {parallelGroup.map((parallelTask) => (
                <div key={`parallel-${parallelTask.id}`} className="flex items-center h-8">
                  <div className="w-48 text-sm truncate pt-4">{parallelTask.name}</div>
                  <div className="flex-1 relative">
                    <div 
                  className={`absolute h-6 ${
                    index.find(i => i.value === task.index)?.color || 'bg-green-100'
                  } border border-green-300 rounded-md px-2 flex items-center text-xs`}
                  style={{ 
                    width: `${parallelTask.standard_time * scale}%`,
                    left: `${currentPosition * scale}%`
                  }}
                    >
                  <span className="truncate">{parallelTask.roles.display_name} ({parallelTask.standard_time} min)</span>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              );
              
              // Update position after this parallel group
              currentPosition += maxTime;
                }
              } else {
                // Regular sequential task
                processedIds.add(task.id);
                
                taskElements.push(
              <div key={`task-${task.id}`} className="flex items-center h-8">
                <div className="w-48 text-sm truncate pt-4">{task.name}</div>
                <div className="flex-1 relative">
                  <div 
                className="absolute h-6 bg-gray-100 border border-gray-300 rounded-md px-2 flex items-center text-xs"
                style={{ 
                  width: `${task.standard_time * scale}%`, 
                  left: `${currentPosition * scale}%`
                }}
                  >
                <span className="truncate">{task.roles.display_name} ({task.standard_time} min)</span>
                  </div>
                </div>
              </div>
                );
                
                currentPosition += task.standard_time;
              }
            });
            
            return taskElements;
              })()}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm"></div>
              <span>Preparation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-sm"></div>
              <span>Sequential</span>
            </div>
            {index.map(i => (
              <div key={i.id} className="flex items-center gap-1">
            <div className={`w-3 h-3 ${i.color} border rounded-sm`}></div>
            <span>Parallel Group {i.value}</span>
              </div>
            ))}
          </div>
            </div>
          </div>
        )}

        {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const updatedCategory = {
                ...editingCategory,
                name: formData.get('name') as string,
              }
              updateCategory(updatedCategory)
              setEditingCategory(null)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Category Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingCategory.name}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This will also delete all subtasks.
            </DialogDescription>
          </DialogHeader>
          {deletingCategory && (
            <form onSubmit={(e) => {
              e.preventDefault()
              deleteCategory(deletingCategory.id)
              setDeletingCategory(null)
            }}>
              <div className="py-4">
                <p className="text-center font-medium">{deletingCategory.name}</p>
                <p className="text-center text-muted-foreground mt-1">
                  Contains {deletingCategory.subtasks.length} subtasks
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" variant="destructive">Yes, delete</Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Subtask Dialog */}
      <Dialog open={!!editingSubTask} onOpenChange={() => {
        setEditingSubTask(null);
        setEditIsPreparationTask(false);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subtask</DialogTitle>
            <DialogDescription>
              Update the subtask details.
            </DialogDescription>
          </DialogHeader>
          {editingSubTask && (
            <form onSubmit={(e) => handleEditSubtaskSubmit(e, editingSubTask.categoryId, editingSubTask.subtask.id)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-subtask-name" className="text-right">
                    Nama sub task
                  </Label>
                  <Input
                    id="edit-subtask-name"
                    name="name"
                    defaultValue={editingSubTask.subtask.name}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-subtask-role" className="text-right">
                    Role
                  </Label>
                  <div className="col-span-3">
                  <SearchableRoleSelect value={selectedRole || editingSubTask.subtask.roles} onValueChange={setSelectedRole}/>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-subtask-prep" className="text-right">
                    Sub task persiapan
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-subtask-prep"
                      name="is_preparation"
                      checked={editIsPreparationTask}
                      onChange={(e) => setEditIsPreparationTask(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-subtask-time" className="text-right">
                    {editIsPreparationTask ? "Waktu persiapan" : "Durasi"}
                  </Label>
                  <div className="col-span-3">
                    {editIsPreparationTask ? (
                      <Select 
                        name="preparationHour" 
                        defaultValue={
                          editingSubTask.subtask.is_preparation 
                            ? String(editingSubTask.subtask.standard_time)
                            : "2880"
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select hours" />
                        </SelectTrigger>
                        <SelectContent>
                          {preparationHours.map(hour => (
                            <SelectItem key={String(hour.value)} value={String(hour.value)}>
                              {hour.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          id="preparationMinutes"
                          name="preparationMinutes"
                          type="number"

                          min="1"
                          placeholder="Duration"
                          defaultValue={
                            !editingSubTask.subtask.is_preparation 
                              ? editingSubTask.subtask.standard_time 
                              : "30"
                          }
                          className="flex-1"
                          required
                        />
                        <span className="text-muted-foreground">minutes</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="is_parallel" className="text-right">
                          Sub task Parallel
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_parallel"
                            name="is_parallel"
                            checked={is_parallelTask || editingSubTask.subtask.is_parallel}
                            onChange={(e) => setIsParallelTask(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      </div>

                      { is_parallelTask || editingSubTask.subtask.is_parallel ? (
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="index" className="text-right">
                          Index
                        </Label>
                        <div className="col-span-3">
                          
                            <Select name="index" defaultValue={editingSubTask.subtask.is_parallel ? String(editingSubTask.subtask.index) : "1"}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Index" />
                              </SelectTrigger>
                              <SelectContent>
                                {index.map(i => (
                                  <SelectItem key={i.value} value={String(i.value)}>
                                    {i.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Label className="text-xs text-muted-foreground">
                            (Subtask yang Parallel harus memiliki index yang sama)
                          </Label>
                        </div>
                      </div>) : <></>}
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}