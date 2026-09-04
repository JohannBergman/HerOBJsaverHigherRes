import * as THREE from 'three'

class HeroOBJExporter {
    constructor () {
      this.output = []

      this.vertexOffset = 1
      this.uvOffset = 1
      this.normalOffset = 1

      this.materials = []
      this.materialLookup = new Map()
    }

  async parse (root) {
    root.updateMatrixWorld(true)

    this.output = '# Herosaver OBJ Export\n\n'

    root.traverse(obj => {
      if (!obj.isMesh) return
      this.exportMesh(obj)
    })

    return {
      obj: this.output,
      mtl: this.generateMTL(),
      textures: this.exportTextures()
    }
  }

    exportMesh (mesh) {
      const geometry = mesh.geometry

      if (!geometry) return
      if (!geometry.attributes.position) return

      const world = mesh.matrixWorld

      const normalMatrix = new THREE.Matrix3()
      normalMatrix.getNormalMatrix(world)

      this.output.push('')
      this.output.push('o ' + (mesh.name || 'Mesh'))

      const material = Array.isArray(mesh.material)
        ? mesh.material[0]
        : mesh.material

      const materialName = this.getMaterialName(material)

      this.output.push('g ' + (mesh.name || 'Mesh'))
      this.output.push('usemtl ' + materialName)

      const pos = geometry.attributes.position
      const norm = geometry.attributes.normal
      const uv = geometry.attributes.uv

      const v = new THREE.Vector3()
      const n = new THREE.Vector3()

      // -----------------------------------
      // vertices
      // -----------------------------------

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
        v.applyMatrix4(world)

        this.output.push(
          `v ${v.x} ${v.y} ${v.z}`
        )
      }

      // -----------------------------------
      // uvs
      // -----------------------------------

      if (uv) {
        for (let i = 0; i < uv.count; i++) {
          this.output.push(
            `vt ${uv.getX(i)} ${1.0 - uv.getY(i)}`
          )
        }
      }

      // -----------------------------------
      // normals
      // -----------------------------------

      if (norm) {
        for (let i = 0; i < norm.count; i++) {
          n.fromBufferAttribute(norm, i)
          n.applyMatrix3(normalMatrix).normalize()

          this.output.push(
            `vn ${n.x} ${n.y} ${n.z}`
          )
        }
      }

      // -----------------------------------
      // faces
      // -----------------------------------

      const index = geometry.index

      if (index) {
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i)
          const b = index.getX(i + 1)
          const c = index.getX(i + 2)

          this.writeFace(a, b, c, !!uv, !!norm)
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          this.writeFace(i, i + 1, i + 2, !!uv, !!norm)
        }
      }

      this.vertexOffset += pos.count

      if (uv) { this.uvOffset += uv.count }

      if (norm) { this.normalOffset += norm.count }
    }

    writeFace (a, b, c, hasUV, hasNormal) {
      a += this.vertexOffset
      b += this.vertexOffset
      c += this.vertexOffset

      let ua = ''
      let ub = ''
      let uc = ''

      let na = ''
      let nb = ''
      let nc = ''

      if (hasUV) {
        ua = a - this.vertexOffset + this.uvOffset
        ub = b - this.vertexOffset + this.uvOffset
        uc = c - this.vertexOffset + this.uvOffset
      }

      if (hasNormal) {
        na = a - this.vertexOffset + this.normalOffset
        nb = b - this.vertexOffset + this.normalOffset
        nc = c - this.normalOffset + this.normalOffset

        na = a - this.vertexOffset + this.normalOffset
        nb = b - this.vertexOffset + this.normalOffset
        nc = c - this.vertexOffset + this.normalOffset
      }

      if (hasUV && hasNormal) {
        this.output.push(
          `f ${a}/${ua}/${na} ${b}/${ub}/${nb} ${c}/${uc}/${nc}`
        )
      } else if (hasUV) {
        this.output.push(
          `f ${a}/${ua} ${b}/${ub} ${c}/${uc}`
        )
      } else {
        this.output.push(
          `f ${a} ${b} ${c}`
        )
      }
    }

    getMaterials () {
      return this.materials
    }

    getMaterialName (material) {
      if (!material) { return 'Default' }

      if (this.materialLookup.has(material)) { return this.materialLookup.get(material) }

      let name = material.name

      if (!name || name.trim() === '') { name = 'Material_' + this.materials.length }

      this.materialLookup.set(material, name)

      this.materials.push({
        name,
        material
      })

      return name
    }
  }

  window.HeroOBJExporter = HeroOBJExporter

export { HeroOBJExporter }
